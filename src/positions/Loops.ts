import { Position, PositionArgs, Severity } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { account, bn, bn18, contract, erc20s, networks } from "@defi.org/web3-candies";
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
            severity: Severity.High,
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
      return [];
    }

    async getAmounts() {
      return [];
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
