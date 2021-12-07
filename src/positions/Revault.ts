import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { account, bn, contract, getNetwork, networks, Token, web3, zero } from "@defi.org/web3-candies";
import { contracts, erc20s } from "./consts";
import _ from "lodash";
import { RevaultChefAbi } from "../../typechain-abi/RevaultChefAbi";

export namespace Revault {
  export class SingleVault implements Position {
    revault = contracts.bsc.Revault_Farm();
    reva = erc20s.bsc.REVA();

    data = {
      amount: zero,
      value: zero,
      pending: zero,
      pendingValue: zero,
      pendingReva: zero,
      pendingRevaValue: zero,
      tvl: zero,
      vaultId: 0,
      vaultHarvestPayload: "",
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset: Token) {}

    getNetwork = () => networks.bsc;

    getArgs = () => this.args;

    getData = () => this.data;

    getAssets = () => [this.asset];

    getRewardAssets = () => [this.asset, this.reva];

    getHealth = () => [];

    getTVL = () => this.data.tvl;

    getAmounts = () => [{ asset: this.asset, amount: this.data.amount, value: this.data.value }];

    getPendingRewards = () => [
      { asset: this.asset, amount: this.data.pending, value: this.data.pendingValue },
      { asset: this.reva, amount: this.data.pendingReva, value: this.data.pendingRevaValue },
    ];

    async load() {
      if ((await getNetwork()).id !== this.getNetwork().id) return;

      const vault = await this.findVault();
      this.data.vaultId = vault.id;
      this.data.amount = vault.principal;
      this.data.vaultHarvestPayload = vault.payload;

      const { returnedRevaAmount, returnedTokenAmount } = await this.revault.methods
        .harvestVault(this.data.vaultId, this.data.vaultHarvestPayload)
        .call({ from: this.args.address });
      this.data.pendingReva = bn(returnedRevaAmount);
      this.data.pending = bn(returnedTokenAmount);
      [this.data.value, this.data.pendingRevaValue, this.data.pendingValue] = await Promise.all([
        this.oracle.valueOf(this.asset, this.data.amount),
        this.oracle.valueOf(this.reva, this.data.pendingReva),
        this.oracle.valueOf(this.asset, this.data.pending),
      ]);

      const chef = contract<RevaultChefAbi>(require("../abi/RevaultChefAbi.json"), await this.revault.methods.revaChef().call());
      const { tvlBusd } = await chef.methods.tokens(this.asset.address).call();
      this.data.tvl = bn(tvlBusd);
    }

    private async findVault() {
      const supportedVaults = {
        [erc20s.bsc.WBNB().address]: { id: 0 },
        [erc20s.bsc.BUSD().address]: { id: 1 },
        [erc20s.bsc.CAKE().address]: { id: 2 },
      };
      const payload = web3().eth.abi.encodeFunctionSignature("getReward()"); //all bunny vaults
      const vaultId = supportedVaults[this.asset.address].id;
      const [vault, principal] = await Promise.all([this.revault.methods.vaults(vaultId).call(), this.revault.methods.getUserVaultPrincipal(vaultId, this.args.address).call()]);
      return { ...vault, id: vaultId, principal: bn(principal), payload };
    }

    getContractMethods = () => _.functions(this.revault.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.revault.methods as any)[method](...args);
      return await tx.call();
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.revault.methods as any)[method](...args);
      alert(`target:\n${this.revault.options.address}\ndata:\n${tx.encodeABI()}`);
      await tx.send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }

    async harvest(useLegacyTx: boolean) {
      await this.revault.methods.harvestVault(this.data.vaultId, this.data.vaultHarvestPayload).send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }
  }
}
