import { PositionFactory } from "./base/PositionFactory";
import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks } from "./base/consts";
import { bn18, erc20, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import _ from "lodash";

export namespace OffChain {
  export function register() {
    PositionFactory.register({
      "x:OffChain:Asset": (args, oracle) => new AssetPosition(args, oracle),
    });
  }

  export type Asset = Token & { symbol: string };

  class AssetPosition implements PositionV1 {
    token: Asset;
    data = {
      amount: zero,
      value: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {
      if (!args.input) throw new Error("input amount required");
      if (!args.address) throw new Error("address symbol required");
      this.token = _.merge(erc20(args.address, zeroAddress), { symbol: args.address });
      this.data.amount = bn18(args.input);
    }

    getName = () => `OffChain:${this.token.name}`;

    getArgs = () => this.args;

    getNetwork = () => networks.off;

    getData = () => this.data;

    getAssets = () => [this.token];

    getRewardAssets = () => [];

    getPendingRewards = () => [];

    getHealth = () => [];

    async load() {
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, this.token, this.data.amount);
    }

    getAmounts = () => [{ asset: this.token, amount: this.data.amount, value: this.data.value }];

    getTVL = () => zero;

    getContractMethods = () => [];

    async callContract(method: string, args: string[]) {}

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }
}
