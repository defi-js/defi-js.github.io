import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, Token, web3, zero } from "@defi.org/web3-candies";
import { contracts, erc20s, networks, sendWithTxType } from "./base/consts";
import _ from "lodash";

export namespace Revault {
  export class SingleVault implements Position {
    revault = contracts.bsc.Revault_Farm();
    chef = contracts.bsc.Revault_Chef();
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
      const vault = await this.findVault();
      this.data.vaultId = vault.id;
      this.data.amount = vault.principal;
      this.data.vaultHarvestPayload = vault.payload;

      const { returnedRevaAmount, returnedTokenAmount } = await this.revault.methods
        .harvestVault(this.data.vaultId, this.data.vaultHarvestPayload)
        .call({ from: this.args.address });
      this.data.pendingReva = bn(returnedRevaAmount);
      this.data.pending = bn(returnedTokenAmount);

      let info;
      [this.data.value, this.data.pendingRevaValue, this.data.pendingValue, info] = await Promise.all([
        this.oracle.valueOf(this.getNetwork().id, this.asset, this.data.amount),
        this.oracle.valueOf(this.getNetwork().id, this.reva, this.data.pendingReva),
        this.oracle.valueOf(this.getNetwork().id, this.asset, this.data.pending),
        this.chef.methods.tokens(this.asset.address).call(),
      ]);
      const { tvlBusd } = info;
      this.data.tvl = bn(tvlBusd);
    }

    private async findVault() {
      const supportedVaults = {
        [erc20s.bsc.WBNB().address]: { id: 0 }, // bunny
        [erc20s.bsc.BUSD().address]: { id: 1 }, // bunny
        [erc20s.bsc.CAKE().address]: { id: 2 }, // bunny
      };
      const payload = web3().eth.abi.encodeFunctionSignature("getReward()"); //all bunny vaults
      const vaultId = supportedVaults[this.asset.address].id;
      const [vault, principal] = await Promise.all([this.revault.methods.vaults(vaultId).call(), this.revault.methods.userVaultPrincipal(vaultId, this.args.address).call()]);
      return { ...vault, id: vaultId, principal: bn(principal), payload };
    }

    getContractMethods = () => _.functions(this.revault.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.revault.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[]) {
      const tx = (this.revault.methods as any)[method](...args);
      alert(`target:\n${this.revault.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, true);
    }

    async harvest() {
      await sendWithTxType(this.revault.methods.harvestVault(this.data.vaultId, this.data.vaultHarvestPayload), true);
    }
  }

  export class RevaStake implements Position {
    staking = contracts.bsc.Revault_RevaStaking();
    reva = erc20s.bsc.REVA();

    data = {
      amount: zero,
      value: zero,
      pendingAmount: zero,
      pendingValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public poolId: number) {}

    getNetwork = () => networks.bsc;

    getArgs = () => this.args;

    getData = () => this.data;

    getAssets = () => [this.reva];

    getRewardAssets = () => [this.reva];

    getHealth = () => [];

    getTVL = () => this.data.tvl;

    getAmounts = () => [{ asset: this.reva, amount: this.data.amount, value: this.data.value }];

    getPendingRewards = () => [{ asset: this.reva, amount: this.data.pendingAmount, value: this.data.pendingValue }];

    async load() {
      const [userInfo, pending, poolInfo] = await Promise.all([
        this.staking.methods.userPoolInfo(this.poolId, this.args.address).call(),
        this.staking.methods.pendingReva(this.poolId, this.args.address).call(),
        this.staking.methods.poolInfo(this.poolId).call(),
      ]);
      this.data.amount = bn(userInfo.amount);
      this.data.pendingAmount = bn(pending);
      [this.data.value, this.data.pendingValue, this.data.tvl] = await Promise.all([
        this.oracle.valueOf(this.getNetwork().id, this.reva, this.data.amount),
        this.oracle.valueOf(this.getNetwork().id, this.reva, this.data.pendingAmount),
        this.oracle.valueOf(this.getNetwork().id, this.reva, bn(poolInfo.totalSupply)),
      ]);
    }

    getContractMethods = () => _.functions(this.staking.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.staking.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[]) {
      const tx = (this.staking.methods as any)[method](...args);
      alert(`target:\n${this.staking.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, true);
    }

    async harvest() {}
  }
}
