import { PositionFactory } from "./base/PositionFactory";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { erc20s, networks } from "./base/consts";
import { erc20, Network, Token, zero } from "@defi.org/web3-candies";

export namespace Aave {
  export function register() {
    PositionFactory.register({
      "avax:AaveV3:aAVAX": (args, oracle) => new Collateral(args, oracle, networks.avax, erc20("aAVAX", "0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97"), erc20s.avax.WAVAX()),
    });
  }

  class Collateral implements PositionV1 {
    data = {
      amount: zero,
      value: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public aToken: Token, public token: Token) {}

    getName = () => "";

    getArgs = () => this.args;

    getNetwork = () => this.network;

    getData = () => this.data;

    getAssets = () => [this.aToken];

    getRewardAssets = () => [];

    getPendingRewards = () => [];

    getHealth = () => [];

    async load() {
      const [amount, totalSupply] = await Promise.all([
        this.aToken.methods.balanceOf(this.args.address).call().then(this.aToken.mantissa),
        this.aToken.methods.totalSupply().call().then(this.aToken.mantissa),
      ]);

      this.data.amount = amount;
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, this.token, this.data.amount);
      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, this.token, totalSupply);
    }

    getAmounts = () => [{ asset: this.token, amount: this.data.amount, value: this.data.value }];

    getTVL = () => this.data.tvl;

    getContractMethods = () => [];

    async callContract(method: string, args: string[]) {}

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }
}
