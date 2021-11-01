import { Position, PositionArgs } from "./base/Position";
import { account, bn, contracts, erc20s, networks, Token } from "@defi.org/web3-candies";
import type { PancakeswapLPAbi } from "@defi.org/web3-candies/typechain-abi/PancakeswapLPAbi";
import { PriceOracle } from "./base/PriceOracle";

export namespace Pancakeswap {
  const POOL_ID_MAPPING_URL = "https://raw.githubusercontent.com/pancakeswap/pancake-frontend/master/src/config/constants/farms.ts";

  export class Farm implements Position {
    masterchef = contracts.bsc.Pancakeswap_Masterchef();
    cake = erc20s.bsc.CAKE();

    constructor(
      public args: PositionArgs,
      public oracle: PriceOracle,
      public asset0: Token,
      public asset1: Token,
      public lpToken: Token & PancakeswapLPAbi,
      public poolId: number
    ) {
      args.address = this.masterchef.options.address;
    }

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

    async getHealth() {
      return [];
    }

    async getAmounts() {
      const [userInfo, reserves, token0, totalSupply] = await Promise.all([
        await this.masterchef.methods.userInfo(this.poolId, this.args.user).call(),
        await this.lpToken.methods.getReserves().call(),
        await this.lpToken.methods.token0().call(),
        await this.lpToken.methods.totalSupply().call(),
      ]);
      const { _reserve0, _reserve1 } = reserves;
      const r0 = token0.toLowerCase() == this.asset0.address.toLowerCase() ? _reserve0 : _reserve1;
      const r1 = r0 == _reserve0 ? _reserve1 : _reserve0;

      const amountLP = bn(userInfo.amount);
      const amount0 = bn(r0).mul(amountLP).div(bn(totalSupply));
      const amount1 = bn(r1).mul(amountLP).div(bn(totalSupply));
      return [
        {
          asset: this.asset0,
          amount: amount0,
          value: await this.oracle.valueOf(this.asset0, amount0),
        },
        {
          asset: this.asset1,
          amount: amount1,
          value: await this.oracle.valueOf(this.asset1, amount1),
        },
      ];
    }

    async getPendingRewards() {
      const amount = bn(await this.masterchef.methods.pendingCake(this.poolId, this.args.user).call());
      return [
        {
          asset: this.cake,
          amount,
          value: await this.oracle.valueOf(this.cake, amount),
        },
      ];
    }

    async claim(useLegacyTx: boolean) {
      if (this.args.user != (await account())) throw new Error("only user able to claim");
      await this.masterchef.methods.deposit(this.poolId, 0).send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }
  }
}
