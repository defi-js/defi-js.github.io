import _ from "lodash";
import { contract, erc20, Token, zero } from "@defi.org/web3-candies";
import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";
import type { SpookyChefAbi } from "../../typechain-abi";

export namespace SpookySwap {
  const orbs = () => erc20("ORBS", "0x3E01B7E242D5AF8064cB9A8F9468aC0f8683617c");
  const usdc = () => erc20("USDC", "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75");
  const ftm = () => erc20("FTM", "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83");

  export function register() {
    PositionFactory.register({
      "ftm:SpookySwap:LP:ORBS/USDC": (args, oracle) => new LP(args, oracle, orbs(), usdc(), "0x4FaA520fe975228F54b30c6996129950E975BD8f", 43),
      "ftm:SpookySwap:LP:ORBS/FTM": (args, oracle) => new LP(args, oracle, orbs(), ftm(), "0x3Ae87E47c69144d1794a78c0709485978C1002A5", -1),
    });
  }

  class LP implements PositionV1 {
    lp = erc20("SpookySwapLP", this.lpAddress);
    boo = erc20("BOO", "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE");
    masterchef = contract<SpookyChefAbi>(require("../abi/SpookyChefAbi.json"), "0x18b4f774fdC7BF685daeeF66c2990b1dDd9ea6aD");

    data = {
      lp: this.lpAddress,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      tvl: zero,
      pending: zero,
      pendingValue: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token, public lpAddress: string, public poolId: number) {}

    getName = () => ``;

    getArgs = () => this.args;

    getNetwork = () => networks.ftm;

    getAssets = () => [this.asset0, this.asset1];

    getRewardAssets = () => [this.boo];

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
        asset: this.boo,
        amount: this.data.pending,
        value: this.data.pendingValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      let [total0, total1, lpAmount, totalSupply] = await Promise.all([
        this.asset0.methods.balanceOf(this.lpAddress).call().then(this.asset0.mantissa),
        this.asset1.methods.balanceOf(this.lpAddress).call().then(this.asset1.mantissa),
        this.lp.methods.balanceOf(this.args.address).call().then(this.lp.mantissa),
        this.lp.methods.totalSupply().call().then(this.lp.mantissa),
      ]);
      if (this.poolId > 0) {
        lpAmount = lpAmount.add(await this.lp.mantissa((await this.masterchef.methods.userInfo(this.poolId, this.args.address).call()).amount));
        this.data.pending = await this.masterchef.methods.pendingBOO(this.poolId, this.args.address).call().then(this.boo.mantissa);
        this.data.pendingValue = await this.oracle.valueOf(this.getNetwork().id, this.boo, this.data.pending);
      }
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
