import { PositionFactory } from "./base/PositionFactory";
import { PositionArgs, PositionV1, Severity } from "./base/PositionV1";
import { bn18, contract, erc20, erc20s, ether, to3, zero } from "@defi.org/web3-candies";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import type { LiquityStabilityPoolAbi, LiquityTroveManagerAbi } from "../../typechain-abi";
import _ from "lodash";

export namespace Liquity {
  export function register() {
    PositionFactory.register({
      "eth:Liquity:LUSD": (args, oracle) => new Pool(args, oracle),
      "eth:Liquity:Trove": (args, oracle) => new CDP(args, oracle),
    });
  }

  const lusd = () => erc20("LUSD", "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0");
  const lqty = () => erc20("LQTY", "0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D");

  class CDP implements PositionV1 {
    manager = contract<LiquityTroveManagerAbi>(require("../abi/LiquityTroveManagerAbi.json"), "0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2");

    CR_LIQUIDATION = bn18(1.1);
    CR_RECOVERY = bn18(1.5);

    data = {
      manager: this.manager.options.address,
      amount: zero,
      value: zero,
      tvl: zero,
      debt: zero,
      cr: zero,
      ltv: zero,
      liquidationPrice: zero,
      entireSystemDebt: zero,
      entireSystemCR: zero,
      recoveryMode: 0,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.eth;
    getData = () => this.data;
    getAssets = () => [erc20s.eth.WETH()];
    getRewardAssets = () => [];
    getPendingRewards = () => [];
    getHealth = () =>
      this.data.cr.lte(this.CR_LIQUIDATION)
        ? [
            {
              severity: Severity.Critical,
              message: `⚠️ LIQUIDATION`,
            },
          ]
        : this.data.cr.lt(this.CR_RECOVERY)
        ? [
            {
              severity: Severity.High,
              message: `CR ${to3(this.data.cr, 18).muln(100).toNumber() / 1000}%`,
            },
          ]
        : [];
    getAmounts = () => [{ asset: erc20s.eth.WETH(), amount: this.data.amount, value: this.data.value }];
    getTVL = () => this.data.tvl;

    async load() {
      const eth = erc20s.eth.WETH();
      const price = await this.oracle.valueOf(this.getNetwork().id, eth, ether);
      const [pos, systemColl, systemDebt, recoveryMode] = await Promise.all([
        this.manager.methods.getEntireDebtAndColl(this.args.address).call(),
        this.manager.methods.getEntireSystemColl().call().then(eth.mantissa),
        this.manager.methods.getEntireSystemDebt().call().then(lusd().mantissa),
        this.manager.methods.checkRecoveryMode(price).call(),
      ]);
      this.data.recoveryMode = recoveryMode ? 1 : 0;
      this.data.amount = await eth.mantissa(pos.coll);
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, eth, this.data.amount);
      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, eth, systemColl);
      this.data.debt = await lusd().mantissa(pos.debt);
      this.data.cr = this.data.value.mul(ether).div(this.data.debt);
      this.data.ltv = ether.mul(ether).div(this.data.cr);
      const crWithGasFeeRebate = this.data.value.mul(ether).div(this.data.debt.sub(await lusd().amount(200)));
      this.data.liquidationPrice = price.mul(this.CR_LIQUIDATION).div(crWithGasFeeRebate);
      this.data.entireSystemDebt = await lusd().mantissa(systemDebt);
      this.data.entireSystemCR = this.data.tvl.mul(ether).div(this.data.entireSystemDebt);
    }

    getContractMethods = () => _.functions(this.manager.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.manager.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.manager.methods as any)[method](...args);
      alert(`target:\n${this.manager.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {}
  }

  class Pool implements PositionV1 {
    pool = contract<LiquityStabilityPoolAbi>(require("../abi/LiquityStabilityPoolAbi.json"), "0x66017D22b0f8556afDd19FC67041899Eb65a21bb");

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
    getAssets = () => [lusd()];
    getRewardAssets = () => [lqty(), erc20s.eth.WETH()];
    getPendingRewards = () => [
      { asset: lqty(), amount: this.data.pendingReward, value: this.data.pendingRewardValue },
      { asset: erc20s.eth.WETH(), amount: this.data.pendingETH, value: this.data.pendingETHValue },
    ];
    getHealth = () => [];
    getAmounts = () => [{ asset: lusd(), amount: this.data.amount, value: this.data.value }];
    getTVL = () => this.data.tvl;

    async load() {
      const [totalDeposits, deposit, rewards, eth] = await Promise.all([
        this.pool.methods.getTotalLUSDDeposits().call().then(lusd().mantissa),
        this.pool.methods.getCompoundedLUSDDeposit(this.args.address).call().then(lusd().mantissa),
        this.pool.methods.getDepositorLQTYGain(this.args.address).call().then(lqty().mantissa),
        this.pool.methods.getDepositorETHGain(this.args.address).call().then(erc20s.eth.WETH().mantissa),
      ]);
      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, lusd(), totalDeposits);
      this.data.amount = deposit;
      this.data.value = await this.oracle.valueOf(this.getNetwork().id, lusd(), this.data.amount);
      this.data.pendingReward = rewards;
      this.data.pendingRewardValue = await this.oracle.valueOf(this.getNetwork().id, lqty(), this.data.pendingReward);
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
