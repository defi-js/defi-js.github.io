import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { account, bn, contract, networks, web3, zero } from "@defi.org/web3-candies";
import { contracts, erc20s } from "./consts";
import _ from "lodash";
import { RevaultChefAbi } from "../../typechain-abi/RevaultChefAbi";

export namespace Revault {
  export class CakeVault implements Position {
    revault = contracts.bsc.Revault_Farm();
    cake = erc20s.bsc.CAKE();
    reva = erc20s.bsc.REVA();

    data = {
      amount: zero,
      value: zero,
      pendingCake: zero,
      pendingCakeValue: zero,
      pendingReva: zero,
      pendingRevaValue: zero,
      tvl: zero,
      vaultId: 0,
      vaultHarvestPayload: "",
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getNetwork = () => networks.bsc;

    getArgs = () => this.args;

    getData = () => this.data;

    getAssets = () => [this.cake];

    getRewardAssets = () => [this.cake, this.reva];

    getHealth = () => [];

    getTVL = () => this.data.tvl;

    getAmounts = () => [{ asset: this.cake, amount: this.data.amount, value: this.data.value }];

    getPendingRewards = () => [
      { asset: this.cake, amount: this.data.pendingCake, value: this.data.pendingCakeValue },
      { asset: this.reva, amount: this.data.pendingReva, value: this.data.pendingRevaValue },
    ];

    async load() {
      const vault = await this.findCakeVault();
      this.data.vaultId = vault.id;
      this.data.amount = vault.principal;
      this.data.vaultHarvestPayload = vault.payload;

      const { returnedRevaAmount, returnedTokenAmount } = await this.revault.methods
        .harvestVault(this.data.vaultId, this.data.vaultHarvestPayload)
        .call({ from: this.args.address });
      this.data.pendingReva = bn(returnedRevaAmount);
      this.data.pendingCake = bn(returnedTokenAmount);
      [this.data.value, this.data.pendingRevaValue, this.data.pendingCakeValue] = await Promise.all([
        this.oracle.valueOf(this.cake, this.data.amount),
        this.oracle.valueOf(this.reva, this.data.pendingReva),
        this.oracle.valueOf(this.cake, this.data.pendingCake),
      ]);

      const chef = contract<RevaultChefAbi>(require("../abi/RevaultChefAbi.json"), await this.revault.methods.revaChef().call());
      const { tvlBusd } = await chef.methods.tokens(this.cake.address).call();
      this.data.tvl = bn(tvlBusd);
    }

    private async findCakeVault() {
      const vaultsLength = parseInt(await this.revault.methods.vaultLength().call());
      const principals = await Promise.all(
        _.times(vaultsLength).map((n) =>
          this.revault.methods
            .getUserVaultPrincipal(n, this.args.address)
            .call()
            .then((r) => ({ id: n, principal: bn(r) }))
        )
      );
      const vaults = await Promise.all(
        principals
          .filter((p) => !p.principal.isZero())
          .map((p) =>
            this.revault.methods
              .vaults(p.id)
              .call()
              .then((r) => ({ ...r, id: p.id, principal: p.principal }))
          )
      );
      const cakeVaults = vaults.filter((v) => v.depositTokenAddress.toLowerCase() === this.cake.address.toLowerCase());
      if (cakeVaults.length !== 1) throw new Error(`expected only 1 vault with balance, got: ${cakeVaults}`);

      const vault = { ...cakeVaults[0], payload: "" };
      switch (vault.id) {
        case 2:
          vault.payload = web3().eth.abi.encodeFunctionSignature("getReward()");
          break;
        default:
          throw new Error(`unsupported yet ${cakeVaults}`);
      }
      return vault;
    }

    getContractMethods = () => _.functions(this.revault.methods);

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
