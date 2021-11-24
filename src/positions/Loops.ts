import { Position, PositionArgs, Severity } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { account, bn, bn18, contract, erc20s, fmt18, getNetwork, networks, to18, zero } from "@defi.org/web3-candies";
import type { AaveLoopAbi } from "../../typechain-abi/AaveLoopAbi";
import type { CompoundLoopAbi } from "../../typechain-abi/CompoundLoopAbi";

export namespace Loops {
  export class AaveLoop implements Position {
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
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

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
        amount: this.data.totalCollateralETH,
        value: this.data.totalCollateralValue,
      },
      {
        asset: this.asset,
        amount: this.data.totalDebtETH,
        value: this.data.totalDebtValue,
      },
    ];

    getPendingRewards = () => [
      {
        asset: this.rewardAsset,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    async load() {
      if ((await getNetwork()).id !== this.getNetwork().id) return;

      const posData = await this.instance.methods.getPositionData().call();
      this.data.healthFactor = bn(posData.healthFactor);
      this.data.totalCollateralETH = bn(posData.totalCollateralETH);
      this.data.totalDebtETH = bn(posData.totalDebtETH);
      this.data.totalCollateralValue = await this.oracle.valueOf(this.weth, this.data.totalCollateralETH);
      this.data.totalDebtValue = await this.oracle.valueOf(this.weth, this.data.totalDebtETH);
      this.data.rewardAmount = bn(await this.instance.methods.getBalanceReward().call());
      this.data.rewardValue = await this.oracle.valueOf(this.aave, this.data.rewardAmount);
    }

    async claim(useLegacyTx: boolean) {
      await this.instance.methods.claimRewardsToOwner().send({
        from: await account(),
        type: useLegacyTx ? "0x0" : "0x2",
      } as any);
    }

    async customAction(useLegacyTx: boolean) {
      alert("sending: " + this.instance.methods.withdrawAllUSDCToOwner().encodeABI());
      await this.instance.methods.withdrawAllUSDCToOwner().send({
        from: await account(),
        type: useLegacyTx ? "0x0" : "0x2",
      } as any);
    }
  }

  export class CompoundLoop implements Position {
    WARN_LIQUIDITY_PERCENT_OF_SUPPLY = 0.25; // percent of total supply 0.25% => ex. $10M principal, $40M supply, $100k min liquidity

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
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle) {}

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
        amount: this.data.supplyBalance,
        value: this.data.supplyBalance,
      },
      {
        asset: this.asset,
        amount: this.data.borrowBalance,
        value: this.data.borrowBalance,
      },
    ];

    getPendingRewards = () => [
      {
        asset: this.rewardAsset,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getHealth() {
      const minLiquidity = this.data.supplyBalance.muln(this.WARN_LIQUIDITY_PERCENT_OF_SUPPLY).divn(100);
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
      if ((await getNetwork()).id !== this.getNetwork().id) return;

      this.data.borrowBalance = to18(await this.instance.methods.borrowBalanceCurrent().call(), 6);
      this.data.supplyBalance = to18(await erc20s.eth.Compound_cUSDC().methods.balanceOfUnderlying(this.args.address).call(), 6);
      this.data.rewardAmount = bn(await this.instance.methods["claimComp()"]().call());
      this.data.rewardValue = await this.oracle.valueOf(this.rewardAsset, this.data.rewardAmount);
      const { accountLiquidity, accountShortfall } = await this.instance.methods.getAccountLiquidityWithInterest().call();
      this.data.accountLiquidity = bn(accountLiquidity);
      this.data.accountShortfall = bn(accountShortfall);
    }

    async claim(useLegacyTx: boolean) {
      await this.instance.methods.claimAndTransferAllCompToOwner().send({
        from: await account(),
        type: useLegacyTx ? "0x0" : "0x2",
      } as any);
    }

    async customAction(useLegacyTx: boolean) {}
  }
}
