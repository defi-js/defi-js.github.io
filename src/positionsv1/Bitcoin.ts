import { PositionFactory } from "./base/PositionFactory";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks } from "./base/consts";
import { bn18, convertDecimals, erc20, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import _ from "lodash";

export namespace Bitcoin {
  export function register() {
    PositionFactory.register({
      "x:Bitcoin": (args, oracle) => new BitcoinBalance(args, oracle),
    });
  }

  export type BTC = Token & { bech32: string };

  class BitcoinBalance implements PositionV1 {
    token: BTC;
    data = {
      amount: zero,
      value: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {
      if (!args.address) throw new Error("bitcoin bech32 bc1 address required");
      this.token = _.merge(erc20(args.address, zeroAddress), { bech32: args.address });
    }

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.btc;
    getData = () => this.data;
    getAssets = () => [this.token];
    getRewardAssets = () => [];
    getPendingRewards = () => [];
    getHealth = () => [];
    getAmounts = () => [{ asset: this.token, amount: this.data.amount, value: this.data.value }];
    getTVL = () => this.data.tvl;

    async load() {
      this.data.tvl = await fetchTVL();
      this.data.amount = await fetchBalance(this.token.bech32);
      this.data.value = await fetchPrice().then((p) => this.data.amount.times(p));
    }

    getContractMethods = () => [];

    async callContract(method: string, args: string[]) {}

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }

  async function fetchTVL() {
    const r = await fetch("https://blockchain.info/q/marketcap");
    const json = await r.json();
    return bn18(json);
  }

  async function fetchBalance(bech32: string) {
    const r = await fetch(`https://blockchain.info/q/addressbalance/${bech32}`);
    const json = await r.json();
    return convertDecimals(json, 8, 18);
  }

  async function fetchPrice() {
    const r = await fetch("https://blockchain.info/q/24hrprice");
    const json = await r.json();
    return parseFloat(json);
  }
}
