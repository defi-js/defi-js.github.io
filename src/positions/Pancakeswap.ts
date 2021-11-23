import { Position, PositionArgs } from "./base/Position";
import { account, bn, contracts, erc20s, getNetwork, networks, Token, zero } from "@defi.org/web3-candies";
import type { PancakeswapLPAbi } from "@defi.org/web3-candies/typechain-abi/PancakeswapLPAbi";
import { PriceOracle } from "./base/PriceOracle";

export namespace Pancakeswap {
  const POOL_ID_MAPPING_URL = "https://raw.githubusercontent.com/pancakeswap/pancake-frontend/master/src/config/constants/farms.ts";

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
    };

    constructor(
      public args: PositionArgs,
      public oracle: PriceOracle,
      public asset0: Token,
      public asset1: Token,
      public lpToken: Token & PancakeswapLPAbi,
      public poolId: number
    ) {}

    getArgs() {
      return this.args;
    }

    getNetwork() {
      return networks.bsc;
    }

    getAssets() {
      return [this.asset0, this.asset1];
    }

    getRewardAssets() {
      return [this.cake];
    }

    getData = () => this.data;

    getHealth() {
      return [];
    }

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

    async load() {
      if ((await getNetwork()).id !== this.getNetwork().id) return;

      const [userInfo, reserves, token0, totalSupply, pending] = await Promise.all([
        await this.masterchef.methods.userInfo(this.poolId, this.args.address).call(),
        await this.lpToken.methods.getReserves().call(),
        await this.lpToken.methods.token0().call(),
        await this.lpToken.methods.totalSupply().call(),
        await this.masterchef.methods.pendingCake(this.poolId, this.args.address).call(),
      ]);
      const { _reserve0, _reserve1 } = reserves;
      const r0 = token0.toLowerCase() == this.asset0.address.toLowerCase() ? _reserve0 : _reserve1;
      const r1 = r0 == _reserve0 ? _reserve1 : _reserve0;
      const amountLP = bn(userInfo.amount);
      this.data.amount0 = bn(r0).mul(amountLP).div(bn(totalSupply));
      this.data.amount1 = bn(r1).mul(amountLP).div(bn(totalSupply));
      this.data.value0 = await this.oracle.valueOf(this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.asset1, this.data.amount1);
      this.data.rewardAmount = bn(pending);
      this.data.rewardValue = await this.oracle.valueOf(this.cake, this.data.rewardAmount);
    }

    async claim(useLegacyTx: boolean) {
      if (this.args.address != (await account())) throw new Error("only user able to claim");
      await this.masterchef.methods.deposit(this.poolId, 0).send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }
  }
}
