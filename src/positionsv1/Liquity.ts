import { PositionFactory } from "./base/PositionFactory";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { bn18, contract, erc20, erc20s, zero } from "@defi.org/web3-candies";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import type { LiquityStabilityPoolAbi } from "../../typechain-abi";
import _ from "lodash";

export namespace Liquity {
  export function register() {
    PositionFactory.register({
      "eth:Liquity:LUSD": (args, oracle) => new Pool(args, oracle),
    });
  }

  class Pool implements PositionV1 {
    pool = contract<LiquityStabilityPoolAbi>(require("../abi/LiquityStabilityPoolAbi.json"), "0x66017D22b0f8556afDd19FC67041899Eb65a21bb");
    lusd = erc20("LUSD", "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0");
    lqty = erc20("LQTY", "0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D");

    data = {
      pool: this.pool.options.address,
      amount: zero,
      value: zero,
      tvl: zero,
      pendingReward: zero,
      pendingRewardValue: zero,
      pendingETH: zero,
      pendingETHValue: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.eth;
    getData = () => this.data;
    getAssets = () => [this.lusd];
    getRewardAssets = () => [this.lqty, erc20s.eth.WETH()];
    getPendingRewards = () => [
      { asset: this.lqty, amount: this.data.pendingReward, value: this.data.pendingRewardValue },
      { asset: erc20s.eth.WETH(), amount: this.data.pendingETH, value: this.data.pendingETHValue },
    ];
    getHealth = () => [];
    getAmounts = () => [{ asset: this.lusd, amount: this.data.amount, value: this.data.value }];
    getTVL = () => this.data.tvl;

    async load() {
      const [totalDeposits, deposit, rewards, eth] = await Promise.all([
        this.pool.methods.getTotalLUSDDeposits().call().then(this.lusd.mantissa),
        this.pool.methods.getCompoundedLUSDDeposit(this.args.address).call().then(this.lusd.mantissa),
        this.pool.methods.getDepositorLQTYGain(this.args.address).call().then(this.lqty.mantissa),
        this.pool.methods.getDepositorETHGain(this.args.address).call().then(bn18),
      ]);
      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, this.lusd, totalDeposits);
      this.data.amount = deposit;
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, this.lusd, this.data.amount);
      this.data.pendingReward = rewards;
      this.data.pendingRewardValue = await this.oracle.valueOf(this.getNetwork().id, this.lqty, this.data.pendingReward);
      this.data.pendingETH = eth;
      this.data.pendingETHValue = await this.oracle.valueOf(this.getNetwork().id, erc20s.eth.WETH(), this.data.pendingETH);
    }

    getContractMethods = () => _.functions(this.pool.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.pool.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.pool.methods as any)[method](...args);
      alert(`target:\n${this.pool.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.pool.methods.withdrawFromSP(0), useLegacyTx);
    }
  }
}
