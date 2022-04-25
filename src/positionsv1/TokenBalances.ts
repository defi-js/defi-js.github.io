import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, Network, Token, web3, zero } from "@defi.org/web3-candies";
import { erc20s, networks } from "./base/consts";
import _ from "lodash";
import { PositionFactory } from "./base/PositionFactory";
import Web3 from "web3";

export namespace TokenBalances {
  class TokenBalance implements PositionV1 {
    data = {
      name: "",
      amount: zero,
      value: zero,
      totalSupply: zero,
      mcap: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public token: Token) {
      token.name = args.name || token.name;
    }

    getName = () => this.data.name;

    getArgs = () => this.args;

    getNetwork = () => this.network;

    getData = () => this.data;

    getAssets = () => [this.token];

    getRewardAssets = () => [];

    getPendingRewards = () => [];

    getHealth = () => [];

    async load() {
      [this.data.name, this.data.amount, this.data.totalSupply] = await Promise.all([
        this.token.methods.name().call(),
        this.token.methods.balanceOf(this.args.address).call().then(this.token.mantissa),
        this.token.methods.totalSupply().call().then(this.token.mantissa),
      ]);
      this.data.value = await this.oracle.valueOf(this.network.id, this.token, this.data.amount);
      this.data.mcap = await this.oracle.valueOf(this.network.id, this.token, this.data.totalSupply);
    }

    getAmounts = () => [{ asset: this.token, amount: this.data.amount, value: this.data.value }];

    getTVL = () => this.data.mcap;

    getContractMethods = () => [];
    async callContract(method: string, args: string[]) {}
    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}
    async harvest(useLegacyTx: boolean) {}
  }

  const nativeTokens = {
    eth: () => _.merge(erc20s.eth.WETH(), { name: "ETH" }),
    bsc: () => _.merge(erc20s.bsc.WBNB(), { name: "BNB" }),
    poly: () => _.merge(erc20s.poly.WMATIC(), { name: "MATIC" }),
    avax: () => _.merge(erc20s.avax.WAVAX(), { name: "AVAX" }),
    arb: () => _.merge(erc20s.arb.WETH(), { name: "AETH" }),
    oeth: () => _.merge(erc20s.oeth.WETH(), { name: "ETH" }),
  };

  class NativeTokenBalance extends TokenBalance {
    getName = () => this.token.name;

    async load() {
      [this.data.amount, this.data.totalSupply] = await Promise.all([web3().eth.getBalance(this.args.address).then(bn), this.token.methods.totalSupply().call().then(bn)]);
      this.data.value = await this.oracle.valueOf(this.network.id, this.token, this.data.amount);
      this.data.mcap = await this.oracle.valueOf(this.network.id, this.token, this.data.totalSupply);
    }
  }

  export function register() {
    _.forEach(networks, (n) => {
      if (n.id < 0) return;
      PositionFactory.register({
        [`${n.shortname}:Token`]: (args, oracle) => new TokenBalance(args, oracle, n, erc20("", Web3.utils.toChecksumAddress(args.input!))),
      });

      const t = (nativeTokens as any)[n.shortname];
      if (t) PositionFactory.register({ [`${n.shortname}:TokenBase`]: (args, oracle) => new NativeTokenBalance(args, oracle, n, t()) });
    });
  }
}
