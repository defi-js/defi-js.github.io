import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, zero } from "@defi.org/web3-candies";
import { networks, sendWithTxType } from "./base/consts";
import _ from "lodash";

export namespace Fodl {
  export class XFodlStake implements PositionV1 {
    fodl = erc20("FODL", "0x4C2e59D098DF7b6cBaE0848d66DE2f8A4889b9C3");
    xfodl = erc20("FODL: xFODL", "0x7e05540A61b531793742fde0514e6c136b5fbAfE");

    data = {
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
        this.xfodl.methods.balanceOf(this.args.address).call().then(bn),
        this.xfodl.methods.totalSupply().call().then(bn),
        this.fodl.methods.balanceOf(this.xfodl.address).call().then(bn),
      ]);
      this.data.amount = myXfodl.mul(fodlStaked).div(xfodlTotalSupply);
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
