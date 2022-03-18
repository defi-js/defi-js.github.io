import _ from "lodash";
import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, contract, erc20, zero } from "@defi.org/web3-candies";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import type { LooksrareStakingAbi } from "../../typechain-abi/LooksrareStakingAbi";
import { PositionFactory } from "./base/PositionFactory";

export namespace LooksRare {
  export function register() {
    PositionFactory.register({
      "eth:LooksRare:LooksStaking": (args, oracle) => new Staking(args, oracle),
    });
  }

  class Staking implements Position {
    eth = erc20s.eth.WETH();
    looks = erc20("LOOKS", "0xf4d2888d29D722226FafA5d9B24F9164c092421E");
    vault = contract<LooksrareStakingAbi>(require("../abi/LooksrareStakingAbi.json"), "0xBcD7254A1D759EFA08eC7c3291B2E85c5dCC12ce");

    data = {
      amount: zero,
      value: zero,
      pendingAmount: zero,
      pendingValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => "";
    getNetwork = () => networks.eth;
    getArgs = () => this.args;
    getData = () => this.data;
    getTVL = () => this.data.tvl;
    getAssets = () => [this.looks];
    getAmounts = () => [{ asset: this.looks, amount: this.data.amount, value: this.data.value }];
    getRewardAssets = () => [this.eth];
    getPendingRewards = () => [{ asset: this.eth, amount: this.data.pendingAmount, value: this.data.pendingValue }];
    getHealth = () => [];

    async load() {
      const [stakedLooks, pendingEth] = await Promise.all([
        this.vault.methods.calculateSharesValueInLOOKS(this.args.address).call().then(bn),
        this.vault.methods.calculatePendingRewards(this.args.address).call().then(bn),
      ]);
      this.data.amount = stakedLooks;
      this.data.pendingAmount = pendingEth;
      const tvlAmount = bn(await this.vault.methods.totalShares().call()).add(bn(await this.vault.methods.calculateSharePriceInLOOKS().call()));

      [this.data.value, this.data.pendingValue, this.data.tvl] = await Promise.all([
        this.oracle.valueOf(this.getNetwork().id, this.looks, this.data.amount),
        this.oracle.valueOf(this.getNetwork().id, this.eth, this.data.pendingAmount),
        this.oracle.valueOf(this.getNetwork().id, this.looks, tvlAmount),
      ]);
    }

    getContractMethods = () => _.functions(this.vault.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.vault.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.vault.methods as any)[method](...args);
      alert(`target:\n${this.vault.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {}
  }
}
