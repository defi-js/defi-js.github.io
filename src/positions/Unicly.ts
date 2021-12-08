import _ from "lodash";
import { Position, PositionArgs } from "./base/Position";
import { account, bn, ether, getNetwork, networks, Token, zero } from "@defi.org/web3-candies";
import { contracts, erc20s } from "./consts";
import { PriceOracle } from "./base/PriceOracle";
import type { UniclyLpAbi } from "../../typechain-abi/UniclyLpAbi";

export namespace Unicly {
  interface Strategy {
    asset: Token;
    lp: Token & UniclyLpAbi;
    poolId: number;
  }

  export const Strategies = {
    uPunks: () => ({
      asset: erc20s.eth.Unicly_UPUNK(),
      lp: erc20s.eth.Unicly_LP_UPUNK_ETH(),
      poolId: 3,
    }),
    uJenny: () => ({
      asset: erc20s.eth.Unicly_UJENNY(),
      lp: erc20s.eth.Unicly_LP_UJENNY_ETH(),
      poolId: 18,
    }),
  };

  export class XUnicFarm implements Position {
    xfarm = contracts.eth.Unicly_XUnicVault();
    unic = erc20s.eth.UNIC();
    xunic = erc20s.eth.XUNIC();
    eth = erc20s.eth.WETH();

    data = {
      amountLP: zero,
      amountAsset: zero,
      amountETH: zero,
      valueAsset: zero,
      valueETH: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public strategy: Strategy) {}

    getArgs = () => this.args;

    getNetwork = () => networks.eth;

    getAssets = () => [this.strategy.asset, this.eth];

    getRewardAssets = () => [this.xunic];

    getData = () => this.data;

    getHealth = () => [];

    getAmounts = () => [
      {
        asset: this.strategy.asset,
        amount: this.data.amountAsset,
        value: this.data.valueAsset,
      },
      {
        asset: this.eth,
        amount: this.data.amountETH,
        value: this.data.valueETH,
      },
    ];

    getPendingRewards = () => [
      {
        asset: this.xunic,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      if ((await getNetwork()).id !== this.getNetwork().id) return;

      const [userInfo, reserves, token0, totalSupply, pending, poolInfo, xunicrate] = await Promise.all([
        this.xfarm.methods.userInfo(this.strategy.poolId, this.args.address).call(),
        this.strategy.lp.methods.getReserves().call(),
        this.strategy.lp.methods.token0().call(),
        this.strategy.lp.methods.totalSupply().call(),
        this.xfarm.methods.pendingxUNICs(this.strategy.poolId, this.args.address).call(),
        this.xfarm.methods.poolInfo(this.strategy.poolId).call(),
        this.xfarm.methods.getxUNICRate().call(),
      ]);
      const { _reserve0, _reserve1 } = reserves;
      const r0 = token0.toLowerCase() === this.strategy.asset.address.toLowerCase() ? _reserve0 : _reserve1;
      const r1 = r0 === _reserve0 ? _reserve1 : _reserve0;
      this.data.amountLP = bn(userInfo.amount);
      this.data.rewardAmount = await this.xunic.mantissa(pending);

      this.data.amountAsset = await this.strategy.asset.mantissa(bn(r0).mul(this.data.amountLP).div(bn(totalSupply)));
      this.data.amountETH = await this.eth.mantissa(bn(r1).mul(this.data.amountLP).div(bn(totalSupply)));

      [this.data.valueAsset, this.data.valueETH, this.data.rewardValue, this.data.tvl] = await Promise.all([
        this.oracle.valueOf(this.strategy.asset, this.data.amountAsset),
        this.oracle.valueOf(this.eth, this.data.amountETH),
        this.oracle.valueOf(this.unic, this.data.rewardAmount.mul(bn(xunicrate)).div(ether)),
        this.oracle.valueOf(this.eth, bn(r1).muln(2).mul(bn(poolInfo.totalLPTokens)).div(bn(totalSupply))),
      ]);
    }

    getContractMethods = () => _.functions(this.xfarm.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.xfarm.methods as any)[method](...args);
      return await tx.call();
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.xfarm.methods as any)[method](...args);
      alert(`target:\n${this.xfarm.options.address}\ndata:\n${tx.encodeABI()}`);
      await tx.send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }

    async harvest(useLegacyTx: boolean) {
      await this.xfarm.methods.deposit(this.strategy.poolId, 0).send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" } as any);
    }
  }
}
