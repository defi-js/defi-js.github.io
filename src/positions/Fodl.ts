import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, zero } from "@defi.org/web3-candies";
import { erc20s, networks, sendWithTxType } from "./consts";
import _ from "lodash";

export namespace Fodl {
  export class XFodlStake implements Position {
    fodl = erc20s.eth.FODL();
    xfodl = erc20s.eth.FODL_XFODL();

    data = {
      amount: zero,
      value: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

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
