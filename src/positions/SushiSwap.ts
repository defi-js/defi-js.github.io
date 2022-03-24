import _ from "lodash";
import { bn, erc20, erc20s, Token, zero } from "@defi.org/web3-candies";
import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { contracts, networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";

export namespace SushiSwap {
  export function register() {
    PositionFactory.register({
      "eth:SushiSwap:Farm:USDC/ETH": (args, oracle) => new Farm(args, oracle, erc20s.eth.USDC(), erc20s.eth.WETH(), 1),
    });
  }

  class Farm implements Position {
    masterchef = contracts.eth.Sushiswap_Masterchef();
    reward = erc20("SUSHI", "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2");

    data = {
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

    getNetwork = () => networks.eth;

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
        this.masterchef.methods.pendingSushi(this.poolId, this.args.address).call(),
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

      this.data.rewardAmount = await this.reward.mantissa(pending);
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
}
