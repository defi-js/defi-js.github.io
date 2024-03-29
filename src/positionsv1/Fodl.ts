import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { erc20, zero } from "@defi.org/web3-candies";
import { networks, sendWithTxType } from "./base/consts";
import _ from "lodash";
import { PositionFactory } from "./base/PositionFactory";

export namespace Fodl {
  export function register() {
    PositionFactory.register({
      "eth:Fodl:XFodlStake": (args, oracle) => new Fodl.XFodlStake(args, oracle),
    });
  }

  export class XFodlStake implements PositionV1 {
    fodl = erc20("FODL", "0x4C2e59D098DF7b6cBaE0848d66DE2f8A4889b9C3");
    xfodl = erc20("FODL: xFODL", "0x7e05540A61b531793742fde0514e6c136b5fbAfE");

    data = {
      fodl: this.fodl.address,
      xfodl: this.xfodl.address,
      amount: zero,
      value: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => ``;

    getNetwork = () => networks.eth;

    getArgs = () => this.args;

    getData = () => this.data;

    getAssets = () => [this.fodl];

    getRewardAssets = () => [this.xfodl];

    getTVL = () => this.data.tvl;

    getHealth = () => [];

    getAmounts = () => [{ asset: this.fodl, amount: this.data.amount, value: this.data.value }];

    getPendingRewards = () => [];

    async load() {
      const [myXfodl, xfodlTotalSupply, fodlStaked] = await Promise.all([
        this.xfodl.methods.balanceOf(this.args.address).call().then(this.xfodl.mantissa),
        this.xfodl.methods.totalSupply().call().then(this.xfodl.mantissa),
        this.fodl.methods.balanceOf(this.xfodl.address).call().then(this.fodl.mantissa),
      ]);
      this.data.amount = myXfodl.times(fodlStaked).div(xfodlTotalSupply);
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, this.fodl, this.data.amount);

      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, this.fodl, fodlStaked);
    }

    getContractMethods = () => _.functions(this.xfodl.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.xfodl.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.xfodl.methods as any)[method](...args);
      alert(`target:\n${this.xfodl.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {}
  }
}
