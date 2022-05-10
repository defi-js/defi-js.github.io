import _ from "lodash";
import type { TraderJoeFarmAbi } from "../../typechain-abi/TraderJoeFarmAbi";
import { bn, contract, erc20, erc20s, Token, zero } from "@defi.org/web3-candies";
import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";

export namespace TraderJoe {
  const orbs = () => erc20("ORBS", "0x340fE1D898ECCAad394e2ba0fC1F93d27c7b717A");

  export function register() {
    PositionFactory.register({
      "avax:TraderJoe:Farm:WETH/AVAX": (args, oracle) => new Farm(args, oracle, erc20s.avax.WETHe(), erc20s.avax.WAVAX(), 26),

      "avax:TraderJoe:LP:ORBS/AVAX": (args, oracle) => new LP(args, oracle, orbs(), erc20s.avax.WAVAX(), "0x0315522354037e48C75756aD68358CE185dad911"),
    });
  }

  class Farm implements PositionV1 {
    masterchef = contract<TraderJoeFarmAbi>(require("../abi/TraderJoeFarmAbi.json"), "0xd6a4F121CA35509aF06A0Be99093d08462f53052");
    reward = erc20("JOE", "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd");

    data = {
      chef: this.masterchef.options.address,
      poolId: this.poolId,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token, public poolId: number) {}

    getName = () => ``;

    getArgs = () => this.args;

    getNetwork = () => networks.avax;

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
      const [poolInfo, userInfo, pending] = await Promise.all([
        this.masterchef.methods.poolInfo(this.poolId).call(),
        this.masterchef.methods.userInfo(this.poolId, this.args.address).call(),
        this.masterchef.methods.pendingTokens(this.poolId, this.args.address).call(),
      ]);
      const lpToken = erc20("LP", poolInfo.lpToken);
      const lpTotalSupply = await lpToken.methods.totalSupply().call().then(bn);
      const lpAmount = bn(userInfo.amount);
      const [total0, total1, lpStaked] = await Promise.all([
        this.asset0.methods
          .balanceOf(lpToken.options.address)
          .call()
          .then((x) => this.asset0.mantissa(x)),
        this.asset1.methods
          .balanceOf(lpToken.options.address)
          .call()
          .then((x) => this.asset1.mantissa(x)),
        lpToken.methods.balanceOf(this.masterchef.options.address).call().then(bn),
      ]);
      this.data.amount0 = total0.mul(lpAmount).div(lpTotalSupply);
      this.data.amount1 = total1.mul(lpAmount).div(lpTotalSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);
      this.data.tvl = (await this.oracle.valueOf(this.getNetwork().id, this.asset0, total0.mul(lpStaked).div(lpTotalSupply))).add(
        await this.oracle.valueOf(this.getNetwork().id, this.asset1, total1.mul(lpStaked).div(lpTotalSupply))
      );

      this.data.rewardAmount = await this.reward.mantissa(pending.pendingJoe);
      this.data.rewardValue = await this.oracle.valueOf(this.getNetwork().id, this.reward, this.data.rewardAmount);
    }

    getContractMethods = () => _.functions(this.masterchef.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.masterchef.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.masterchef.methods as any)[method](...args);
      alert(`target:\n${this.masterchef.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.masterchef.methods.deposit(this.poolId, 0), useLegacyTx);
    }
  }

  class LP implements PositionV1 {
    lp = erc20("TraderJoeLP", this.lpAddress);

    data = {
      lp: this.lpAddress,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token, public lpAddress: string) {}

    getName = () => ``;

    getArgs = () => this.args;

    getNetwork = () => networks.avax;

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
      const [total0, total1, lpAmount, totalSupply] = await Promise.all([
        this.asset0.methods.balanceOf(this.lpAddress).call().then(this.asset0.mantissa),
        this.asset1.methods.balanceOf(this.lpAddress).call().then(this.asset1.mantissa),
        this.lp.methods.balanceOf(this.args.address).call().then(this.lp.mantissa),
        this.lp.methods.totalSupply().call().then(this.lp.mantissa),
      ]);
      this.data.amount0 = total0.mul(lpAmount).div(totalSupply);
      this.data.amount1 = total1.mul(lpAmount).div(totalSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);
      if (this.data.value0.isZero()) this.data.value0 = this.data.value1;
      else if (this.data.value1.isZero()) this.data.value1 = this.data.value0;

      let totalValue0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, total0);
      let totalValue1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, total1);
      if (totalValue0.isZero()) totalValue0 = totalValue1;
      else if (totalValue1.isZero()) totalValue1 = totalValue0;
      this.data.tvl = totalValue0.add(totalValue1);
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
