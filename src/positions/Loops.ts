import { Position, PositionArgs, Severity } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { account, bn, bn18, contract, erc20s, fmt18, networks, to18 } from "@defi.org/web3-candies";
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

    async getHealth() {
      const data = await this.instance.methods.getPositionData().call();
      const hf = bn(data.healthFactor);
      if (hf.lt(this.WARN_HEALTH_FACTOR)) {
        return [
          {
            severity: Severity.Critical,
            message: "Low Health Factor!",
            info: { args: this.args, data },
          },
        ];
      }
      return [];
    }

    async getAmounts() {
      const { totalCollateralETH, totalDebtETH } = await this.instance.methods.getPositionData().call();
      return [
        {
          asset: this.asset,
          amount: bn(totalCollateralETH),
          value: await this.oracle.valueOf(this.weth, bn(totalCollateralETH)),
        },
        {
          asset: this.asset,
          amount: bn(totalDebtETH),
          value: await this.oracle.valueOf(this.weth, bn(totalDebtETH)),
        },
      ];
    }

    async getPendingRewards() {
      const amount = bn(await this.instance.methods.getBalanceReward().call());
      const value = await this.oracle.valueOf(this.aave, amount);
      return [
        {
          asset: this.rewardAsset,
          amount,
          value,
        },
      ];
    }

    async claim(useLegacyTx: boolean) {
      await this.instance.methods.claimRewardsToOwner().send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }
  }

  export class CompoundLoop implements Position {
    WARN_LIQUIDITY_iPERCENT_OF_SUPPLY = 400; // 0.25% => ex. $10M principal, $40M supply, $100k min liquidity

    instance = contract<CompoundLoopAbi>(require("../abi/CompoundLoopAbi.json"), this.args.address);
    asset = erc20s.eth.USDC();
    rewardAsset = erc20s.eth.COMP();

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

    async getHealth() {
      const [supplied] = await this.getAmounts();
      const { accountLiquidity, accountShortfall } = await this.instance.methods.getAccountLiquidityWithInterest().call();
      const minLiquidity = supplied.value.divn(this.WARN_LIQUIDITY_iPERCENT_OF_SUPPLY);

      if (!bn(accountShortfall).isZero() || bn(accountLiquidity).lt(minLiquidity)) {
        return [
          {
            severity: Severity.Critical,
            message: "Low Liquidity!",
            info: { args: this.args, accountLiquidity, accountShortfall },
          },
        ];
      }
      return [];
    }

    async getAmounts() {
      const borrowBalance = to18(await this.instance.methods.borrowBalanceCurrent().call(), 6);
      const supplyBalance = to18(await erc20s.eth.Compound_cUSDC().methods.balanceOfUnderlying(this.args.address).call(), 6);
      return [
        {
          asset: this.asset,
          amount: supplyBalance,
          value: supplyBalance,
        },
        {
          asset: this.asset,
          amount: borrowBalance,
          value: borrowBalance,
        },
      ];
    }

    async getPendingRewards() {
      const amount = bn(await this.instance.methods["claimComp()"]().call());
      return [
        {
          asset: this.rewardAsset,
          amount,
          value: await this.oracle.valueOf(this.rewardAsset, amount),
        },
      ];
    }

    async claim(useLegacyTx: boolean) {
      await this.instance.methods.claimAndTransferAllCompToOwner().send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }
  }
}
