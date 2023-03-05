import { bn, contract, erc20, erc20s, Token, zero } from "@defi.org/web3-candies";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";
import { QuickswapStakingAbi } from "../../typechain-abi";
import _ from "lodash";

export namespace QuickSwap {
  const orbs = () => erc20("ORBS", "0x614389EaAE0A6821DC49062D56BDA3d9d45Fa2ff");
  const quick = () => erc20("QUICK", "0x831753DD7087CaC61aB5644b308642cc1c33Dc13");

  export function register() {
    PositionFactory.register({
      "poly:QuickSwap:Farm:ORBS/USDC": (args, oracle) => new Farm(args, oracle, erc20s.poly.USDC(), orbs(), "0x9CA237962823A0a74bbC8354764e1DAC9e4057F0"),

      "poly:QuickSwap:LP:ORBS/QUICK": (args, oracle) => new LP(args, oracle, orbs(), quick(), "0x882624931b4A799d50242e5b25E2Fa2719E4d072"),
      "poly:QuickSwap:LP:ORBS/JPYC": (args, oracle) =>
        new LP(args, oracle, orbs(), erc20("JPYC", "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB"), "0xD01C074C78E9647a5ddAE2648f1A089b98D5380a"),
    });
  }

  class Farm implements PositionV1 {
    staking = contract<QuickswapStakingAbi>(require("../abi/QuickswapStakingAbi.json"), this.stakingAddress);
    reward = erc20("dQUICK", "0xf28164A485B0B2C90639E47b0f377b4a438a16B1");

    data = {
      contract: this.stakingAddress,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token, public stakingAddress: string) {}

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.poly;
    getAssets = () => [this.asset0, this.asset1];
    getRewardAssets = () => [this.reward];
    getData = () => this.data;
    getHealth = () => [];
    getAmounts = () => [
      {
        asset: this.asset0,
        amount: this.data.amount0,
        value: this.data.value0,
      },
      {
        asset: this.asset1,
        amount: this.data.amount1,
        value: this.data.value1,
      },
    ];

    getPendingRewards = () => [
      {
        asset: this.reward,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      const [stakedBalance, totalStaked, earned, lpAddress] = await Promise.all([
        this.staking.methods.balanceOf(this.args.address).call().then(bn),
        this.staking.methods.totalSupply().call().then(bn),
        this.staking.methods.earned(this.args.address).call().then(this.reward.mantissa),
        this.staking.methods.stakingToken().call(),
      ]);
      this.data.rewardAmount = earned;
      this.data.rewardValue = await this.oracle.valueOf(this.getNetwork().id, this.reward, this.data.rewardAmount);

      const lp = erc20("LP", lpAddress);

      const [amount0InLp, amount1InLp, totalLpSupply] = await Promise.all([
        this.asset0.methods.balanceOf(lpAddress).call().then(this.asset0.mantissa),
        this.asset1.methods.balanceOf(lpAddress).call().then(this.asset1.mantissa),
        lp.methods.totalSupply().call().then(bn),
      ]);
      this.data.amount0 = stakedBalance.times(amount0InLp).div(totalLpSupply);
      this.data.amount1 = stakedBalance.times(amount1InLp).div(totalLpSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);

      const tvl_amount0 = totalStaked.times(amount0InLp).div(totalLpSupply);
      const tvl_amount1 = totalStaked.times(amount1InLp).div(totalLpSupply);
      const tvl_value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, tvl_amount0);
      const tvl_value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, tvl_amount1);
      this.data.tvl = tvl_value0.plus(tvl_value1);
    }

    getContractMethods = () => _.functions(this.staking.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.staking.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.staking.methods as any)[method](...args);
      alert(`target:\n${this.staking.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.staking.methods.stake(0), useLegacyTx);
    }
  }

  class LP implements PositionV1 {
    lp = erc20("QuickswapLP", this.lpAddress);

    data = {
      contract: this.lpAddress,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token, public lpAddress: string) {}

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.poly;
    getAssets = () => [this.asset0, this.asset1];
    getRewardAssets = () => [];
    getData = () => this.data;
    getHealth = () => [];
    getAmounts = () => [
      {
        asset: this.asset0,
        amount: this.data.amount0,
        value: this.data.value0,
      },
      {
        asset: this.asset1,
        amount: this.data.amount1,
        value: this.data.value1,
      },
    ];

    getPendingRewards = () => [];

    getTVL = () => this.data.tvl;

    async load() {
      const [balance, totalSupply] = await Promise.all([this.lp.methods.balanceOf(this.args.address).call().then(bn), this.lp.methods.totalSupply().call().then(bn)]);

      const [amount0InLp, amount1InLp] = await Promise.all([
        this.asset0.methods.balanceOf(this.lpAddress).call().then(this.asset0.mantissa),
        this.asset1.methods.balanceOf(this.lpAddress).call().then(this.asset1.mantissa),
      ]);
      this.data.amount0 = amount0InLp.times(balance).div(totalSupply);
      this.data.amount1 = amount1InLp.times(balance).div(totalSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);

      const tvl_value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, amount0InLp);
      const tvl_value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, amount1InLp);
      this.data.tvl = tvl_value0.plus(tvl_value1);
    }

    getContractMethods = () => _.functions(this.lp.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.lp.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.lp.methods as any)[method](...args);
      alert(`target:\n${this.lp.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {}
  }
}
