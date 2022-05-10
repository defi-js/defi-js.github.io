import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { bn, contract, erc20, Token, web3, zero } from "@defi.org/web3-candies";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import _ from "lodash";
import type { RevaultFarmAbi } from "../../typechain-abi/RevaultFarmAbi";
import type { RevaultChefAbi } from "../../typechain-abi/RevaultChefAbi";
import type { RevaultStakingAbi } from "../../typechain-abi/RevaultStakingAbi";
import { PositionFactory } from "./base/PositionFactory";

export namespace Revault {
  export function register() {
    PositionFactory.register({
      "bsc:Revault:SingleVault:CAKE": (args, oracle) => new SingleVault(args, oracle, erc20s.bsc.CAKE()),
      "bsc:Revault:SingleVault:BUSD": (args, oracle) => new SingleVault(args, oracle, erc20s.bsc.BUSD()),
      "bsc:Revault:SingleVault:BNB": (args, oracle) => new SingleVault(args, oracle, erc20s.bsc.WBNB()),
    });
    for (let i = 0; i < 4; i++) {
      PositionFactory.register({
        [`bsc:Revault:RevaStaking:x${i + 1}`]: (args, oracle) => new RevaStake(args, oracle, i),
      });
    }
  }

  const REVA = () => erc20("REVA", "0x4FdD92Bd67Acf0676bfc45ab7168b3996F7B4A3B");
  const revaultFarm = () => contract<RevaultFarmAbi>(require("../abi/RevaultFarmAbi.json"), "0x2642fa04bd1f7250be6539c5bDa36335333d9Ccd");
  const revaultChef = () => contract<RevaultChefAbi>(require("../abi/RevaultChefAbi.json"), "0xd7550285532f1642511b16Df858546F2593d638B");
  const revaStaking = () => contract<RevaultStakingAbi>(require("../abi/RevaultStakingAbi.json"), "0x8B7b2a115201ACd7F95d874D6A9432FcEB9C466A");

  class SingleVault implements PositionV1 {
    revault = revaultFarm();
    chef = revaultChef();
    reva = REVA();

    data = {
      revault: this.revault.options.address,
      chef: this.chef.options.address,
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

    getName = () => ``;

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

  class RevaStake implements PositionV1 {
    staking = revaStaking();
    reva = REVA();

    data = {
      staking: this.staking.options.address,
      amount: zero,
      value: zero,
      pendingAmount: zero,
      pendingValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public poolId: number) {}

    getName = () => ``;

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
