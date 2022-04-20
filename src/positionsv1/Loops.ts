import { PositionV1, PositionArgs, Severity } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { bn, bn18, contract, erc20s, ether, to18, zero } from "@defi.org/web3-candies";
import type { AaveLoopAbi } from "../../typechain-abi/AaveLoopAbi";
import type { CompoundLoopAbi } from "../../typechain-abi/CompoundLoopAbi";
import _ from "lodash";
import { networks, sendWithTxType } from "./base/consts";

export namespace Loops {
  /**
   * Aave on Ethereum
   */
  export class AaveLoop implements PositionV1 {
    WARN_HEALTH_FACTOR = bn18("1.0641");

    instance = contract<AaveLoopAbi>(require("../abi/AaveLoopAbi.json"), this.args.address);
    asset = erc20s.eth.USDC();
    rewardAsset = erc20s.eth.Aave_stkAAVE();
    aave = erc20s.eth.AAVE();
    weth = erc20s.eth.WETH();

    data = {
      healthFactor: zero,
      totalCollateralETH: zero,
      totalCollateralValue: zero,
      totalDebtETH: zero,
      totalDebtValue: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => ``;

    getArgs() {
      return this.args;
    }

    getNetwork() {
      return networks.eth;
    }

    getAssets() {
      return [this.asset];
    }

    getRewardAssets() {
      return [this.rewardAsset];
    }

    getData = () => this.data;

    getHealth() {
      if (!this.data.healthFactor.isZero() && this.data.healthFactor.lt(this.WARN_HEALTH_FACTOR)) {
        return [
          {
            severity: Severity.Critical,
            message: "Low Health Factor!",
          },
        ];
      }
      return [];
    }

    getAmounts = () => [
      {
        asset: this.asset,
        amount: this.data.totalCollateralETH.sub(this.data.totalDebtETH),
        value: this.data.totalCollateralValue.sub(this.data.totalDebtValue),
      },
    ];

    getPendingRewards = () => [
      {
        asset: this.rewardAsset,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      const posData = await this.instance.methods.getPositionData().call();
      this.data.healthFactor = bn(posData.healthFactor);
      this.data.totalCollateralETH = bn(posData.totalCollateralETH);
      this.data.totalDebtETH = bn(posData.totalDebtETH);

      this.data.totalCollateralValue = await this.oracle.valueOf(this.getNetwork().id, this.weth, this.data.totalCollateralETH);
      this.data.totalDebtValue = await this.oracle.valueOf(this.getNetwork().id, this.weth, this.data.totalDebtETH);
      this.data.rewardAmount = bn(await this.instance.methods.getBalanceReward().call());
      this.data.rewardValue = await this.oracle.valueOf(this.getNetwork().id, this.aave, this.data.rewardAmount);

      const atoken = erc20s.eth.Aave_aUSDC();
      this.data.tvl = await this.oracle.valueOf(this.getNetwork().id, this.asset, await atoken.mantissa(await atoken.methods.totalSupply().call()));
    }

    getContractMethods = () => _.functions(this.instance.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.instance.methods as any)[method](...args);
      return await tx.call({ from: await this.instance.methods.owner().call() });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.instance.methods as any)[method](...args);
      alert(`target:\n${this.instance.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.instance.methods.claimRewardsToOwner(), useLegacyTx);
    }
  }

  /**
   * Compound on ethereum
   */
  export class CompoundLoop implements PositionV1 {
    WARN_LIQUIDITY_PERCENT_OF_PRINCIPAL = 0.005; // percent of total supply 0.25% => ex. $10M principal, $40M supply, $100k min liquidity

    instance = contract<CompoundLoopAbi>(require("../abi/CompoundLoopAbi.json"), this.args.address);
    asset = erc20s.eth.USDC();
    rewardAsset = erc20s.eth.COMP();

    data = {
      borrowBalance: zero,
      supplyBalance: zero,
      rewardAmount: zero,
      rewardValue: zero,
      accountLiquidity: zero,
      accountShortfall: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

    getName = () => ``;

    getArgs() {
      return this.args;
    }

    getNetwork() {
      return networks.eth;
    }

    getAssets() {
      return [this.asset];
    }

    getRewardAssets() {
      return [this.rewardAsset];
    }

    getData = () => this.data;

    getAmounts = () => [
      {
        asset: this.asset,
        amount: this.data.supplyBalance.sub(this.data.borrowBalance),
        value: this.data.supplyBalance.sub(this.data.borrowBalance),
      },
    ];

    getTVL = () => this.data.tvl;

    getPendingRewards = () => [
      {
        asset: this.rewardAsset,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getHealth() {
      const minLiquidity = this.data.supplyBalance.muln(this.WARN_LIQUIDITY_PERCENT_OF_PRINCIPAL).divn(100);
      if (!this.data.accountShortfall.isZero() || bn(this.data.accountLiquidity).lt(minLiquidity)) {
        return [
          {
            severity: Severity.Critical,
            message: "Low Liquidity!",
          },
        ];
      }
      return [];
    }

    async load() {
      const ctoken = erc20s.eth.Compound_cUSDC();
      const [totalSupply, exchangeRate, underlyingBalance, borrowBalance, pending, liquidity] = await Promise.all([
        ctoken.methods.totalSupply().call(),
        ctoken.methods.exchangeRateCurrent().call(),
        ctoken.methods.balanceOfUnderlying(this.args.address).call(),
        this.instance.methods.borrowBalanceCurrent().call(),
        this.instance.methods["claimComp()"]().call(),
        this.instance.methods.getAccountLiquidityWithInterest().call(),
      ]);

      this.data.supplyBalance = await this.asset.mantissa(underlyingBalance);
      this.data.borrowBalance = await this.asset.mantissa(borrowBalance);
      this.data.rewardAmount = bn(pending);
      this.data.rewardValue = await this.oracle.valueOf(this.getNetwork().id, this.rewardAsset, this.data.rewardAmount);
      this.data.accountLiquidity = bn(liquidity.accountLiquidity);
      this.data.accountShortfall = bn(liquidity.accountShortfall);

      this.data.tvl = (await ctoken.mantissa(totalSupply)).mul(to18(exchangeRate, 16)).div(ether);
    }

    getContractMethods = () => _.functions(this.instance.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.instance.methods as any)[method](...args);
      return await tx.call({ from: await this.instance.methods.owner().call() });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.instance.methods as any)[method](...args);
      alert(`target:\n${this.instance.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.instance.methods.claimAndTransferAllCompToOwner(), useLegacyTx);
    }
  }
}