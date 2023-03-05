import { bn, contract, erc20, erc20s, Token, zero } from "@defi.org/web3-candies";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";
import { PangolinChefAbi } from "../../typechain-abi";
import _ from "lodash";

export namespace Pangolin {
  const orbs = () => erc20("ORBS", "0x340fE1D898ECCAad394e2ba0fC1F93d27c7b717A");
  const png = () => erc20("PNG", "0x60781C2586D68229fde47564546784ab3fACA982");

  export function register() {
    PositionFactory.register({
      "avax:Pangolin:Farm:ORBS/AVAX": (args, oracle) => new Farm(args, oracle, orbs(), erc20s.avax.WAVAX(), 36),
    });
  }

  class Farm implements PositionV1 {
    chef = contract<PangolinChefAbi>(require("../abi/PangolinChefAbi.json"), "0x1f806f7C8dED893fd3caE279191ad7Aa3798E928");
    reward = png();

    data = {
      chef: this.chef.options.address,
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
      const [stakedBalance, pending, lpAddress] = await Promise.all([
        this.chef.methods
          .userInfo(this.poolId, this.args.address)
          .call()
          .then((x) => bn(x.amount)),
        this.chef.methods.pendingReward(this.poolId, this.args.address).call().then(bn),
        this.chef.methods.lpToken(this.poolId).call(),
      ]);
      this.data.rewardAmount = pending;
      this.data.rewardValue = await this.oracle.valueOf(this.getNetwork().id, this.reward, this.data.rewardAmount);

      const lp = erc20("LP", lpAddress);

      const [amount0InLp, amount1InLp, totalLpSupply, totalStaked] = await Promise.all([
        this.asset0.methods.balanceOf(lpAddress).call().then(this.asset0.mantissa),
        this.asset1.methods.balanceOf(lpAddress).call().then(this.asset1.mantissa),
        lp.methods.totalSupply().call().then(bn),
        lp.methods.balanceOf(this.chef.options.address).call().then(bn),
      ]);
      this.data.amount0 = stakedBalance.times(amount0InLp).div(totalLpSupply);
      this.data.amount1 = stakedBalance.times(amount1InLp).div(totalLpSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);
      if (this.data.value0.isZero()) this.data.value0 = this.data.value1;

      const tvl_amount0 = totalStaked.times(amount0InLp).div(totalLpSupply);
      const tvl_amount1 = totalStaked.times(amount1InLp).div(totalLpSupply);
      const tvl_value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, tvl_amount0);
      const tvl_value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, tvl_amount1);
      this.data.tvl = tvl_value0.isZero() ? tvl_value1.times(2) : tvl_value0.plus(tvl_value1);
    }

    getContractMethods = () => _.functions(this.chef.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.chef.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.chef.methods as any)[method](...args);
      alert(`target:\n${this.chef.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.chef.methods.deposit(this.poolId, 0, this.args.address), useLegacyTx);
    }
  }
}
