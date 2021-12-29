import { Position, PositionArgs } from "./base/Position";
import { bn, contracts, erc20s, Token, zero } from "@defi.org/web3-candies";
import type { PancakeswapLPAbi } from "@defi.org/web3-candies/typechain-abi/PancakeswapLPAbi";
import { PriceOracle } from "./base/PriceOracle";
import _ from "lodash";
import { networks, sendWithTxType } from "./consts";

export namespace Pancakeswap {
  // const POOL_ID_MAPPING_URL = "https://raw.githubusercontent.com/pancakeswap/pancake-frontend/master/src/config/constants/farms.ts";

  export class Farm implements Position {
    masterchef = contracts.bsc.Pancakeswap_Masterchef();
    cake = erc20s.bsc.CAKE();

    data = {
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(
      public args: PositionArgs,
      public oracle: PriceOracle,
      public asset0: Token,
      public asset1: Token,
      public lpToken: Token & PancakeswapLPAbi,
      public poolId: number
    ) {}

    getArgs = () => this.args;

    getNetwork = () => networks.bsc;

    getAssets = () => [this.asset0, this.asset1];

    getRewardAssets = () => [this.cake];

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
        asset: this.cake,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      const [userInfo, reserves, token0, totalSupply, pending, lpStaked] = await Promise.all([
        this.masterchef.methods.userInfo(this.poolId, this.args.address).call(),
        this.lpToken.methods.getReserves().call(),
        this.lpToken.methods.token0().call(),
        this.lpToken.methods.totalSupply().call(),
        this.masterchef.methods.pendingCake(this.poolId, this.args.address).call(),
        this.lpToken.methods.balanceOf(this.masterchef.options.address).call(),
      ]);
      const { _reserve0, _reserve1 } = reserves;
      const r0 = token0.toLowerCase() === this.asset0.address.toLowerCase() ? _reserve0 : _reserve1;
      const r1 = r0 === _reserve0 ? _reserve1 : _reserve0;
      const amountLP = bn(userInfo.amount);
      this.data.rewardAmount = bn(pending);

      this.data.amount0 = await this.asset0.mantissa(bn(r0).mul(amountLP).div(bn(totalSupply)));
      this.data.amount1 = await this.asset1.mantissa(bn(r1).mul(amountLP).div(bn(totalSupply)));

      [this.data.value0, this.data.value1, this.data.rewardValue, this.data.tvl] = await Promise.all([
        this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0),
        this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1),
        this.oracle.valueOf(this.getNetwork().id, this.cake, this.data.rewardAmount),
        this.oracle.valueOf(this.getNetwork().id, this.asset1, bn(r1).muln(2).mul(bn(lpStaked)).div(bn(totalSupply))),
      ]);
    }

    getContractMethods = () => _.functions(this.masterchef.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.masterchef.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[]) {
      const tx = (this.masterchef.methods as any)[method](...args);
      alert(`target:\n${this.masterchef.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, true);
    }

    async harvest() {
      await sendWithTxType(this.masterchef.methods.deposit(this.poolId, 0), true);
    }
  }
}
