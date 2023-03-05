import { PositionFactory } from "./base/PositionFactory";
import { contract, erc20, zero } from "@defi.org/web3-candies";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { RookLiquidityPoolAbi } from "../../typechain-abi";
import _ from "lodash";

export namespace Rook {
  export function register() {
    PositionFactory.register({
      "eth:Rook:xRook": (args, oracle) => new XRook(args, oracle),
    });
  }

  class XRook implements PositionV1 {
    pool = contract<RookLiquidityPoolAbi>(require("../abi/RookLiquidityPoolAbi.json"), "0x4F868C1aa37fCf307ab38D215382e88FCA6275E2");
    rook = erc20("ROOK", "0xfA5047c9c78B8877af97BDcb85Db743fD7313d4a");
    xrook = erc20("xROOK", "0x8aC32F0a635a0896a8428A9c31fBf1AB06ecf489");

    data = {
      amount: zero,
      value: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => "";
    getArgs = () => this.args;
    getNetwork = () => networks.eth;
    getData = () => this.data;
    getAssets = () => [this.xrook];
    getRewardAssets = () => [];
    getPendingRewards = () => [];
    getHealth = () => [];
    getTVL = () => this.data.tvl;
    getAmounts = () => [{ asset: this.rook, amount: this.data.amount, value: this.data.value }];

    async load() {
      this.data.amount = await this.pool.methods.underlyingBalance(this.rook.address, this.args.address).call().then(this.rook.mantissa);
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, this.rook, this.data.amount);
      const tvlAmount = await this.pool.methods.totalValueLocked(this.rook.address).call().then(this.rook.mantissa);
      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, this.rook, tvlAmount);
    }

    getContractMethods = () => _.functions(this.xrook.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.xrook.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[]) {
      const tx = (this.xrook.methods as any)[method](...args);
      alert(`target:\n${this.xrook.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, true);
    }

    async harvest() {}
  }
}
