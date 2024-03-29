import _ from "lodash";
import { erc20, Token, zero } from "@defi.org/web3-candies";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";

export namespace SpiritSwap {
  const orbs = () => erc20("ORBS", "0x3E01B7E242D5AF8064cB9A8F9468aC0f8683617c");
  const usdc = () => erc20("USDC", "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75");
  const ftm = () => erc20("FTM", "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83");

  export function register() {
    PositionFactory.register({
      "ftm:SpiritSwap:LP:ORBS/USDC": (args, oracle) => new LP(args, oracle, orbs(), usdc(), "0x4B668A229740b4F6d04cE2D1b05648Ef1d508EC1"),
      "ftm:SpiritSwap:LP:ORBS/FTM": (args, oracle) => new LP(args, oracle, orbs(), ftm(), "0x1F0700387Dfe4Aec7b8C99fbf54cdCDbBB5603B5"),
    });
  }

  class LP implements PositionV1 {
    lp = erc20("SpiritSwapLP", this.lpAddress);

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

    getNetwork = () => networks.ftm;

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
      this.data.amount0 = total0.times(lpAmount).div(totalSupply);
      this.data.amount1 = total1.times(lpAmount).div(totalSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);

      if (this.data.value0.isZero()) this.data.value0 = this.data.value1;
      else if (this.data.value1.isZero()) this.data.value1 = this.data.value0;

      let totalValue0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, total0);
      let totalValue1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, total1);

      if (totalValue0.isZero()) totalValue0 = totalValue1;
      else if (totalValue1.isZero()) totalValue1 = totalValue0;
      this.data.tvl = totalValue0.plus(totalValue1);
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
