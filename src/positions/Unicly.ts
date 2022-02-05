import _ from "lodash";
import { Position, PositionArgs } from "./base/Position";
import { bn, contract, erc20, ether, Token, zero } from "@defi.org/web3-candies";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import { PriceOracle } from "./base/PriceOracle";
import type { UniclyLpAbi } from "../../typechain-abi/UniclyLpAbi";
import type { UniclyXUnicAbi } from "../../typechain-abi/UniclyXUnicAbi";

export namespace Unicly {
  interface Strategy {
    asset: Token;
    lp: Token & UniclyLpAbi;
    poolId: number;
  }

  export const Strategies = {
    uPunks: () => ({
      asset: erc20("Unicly: uPUNK", "0x8d2BFfCbB19Ff14A698C424FbcDcFd17aab9b905"),
      lp: erc20<UniclyLpAbi>("Unicly: LP uPUNK/ETH", "0xc809Af9E3490bCB2B3bA2BF15E002f0A6a1F6835", require("../abi/UniclyLpAbi.json")),
      poolId: 3,
    }),
    uJenny: () => ({
      asset: erc20("Unicly: uJenny", "0xa499648fD0e80FD911972BbEb069e4c20e68bF22"),
      lp: erc20<UniclyLpAbi>("Unicly: LP uJenny/ETH", "0xEC5100AD159F660986E47AFa0CDa1081101b471d", require("../abi/UniclyLpAbi.json")),
      poolId: 18,
    }),
  };

  export class XUnicFarm implements Position {
    xfarm = contract<UniclyXUnicAbi>(require("../abi/UniclyXUnicAbi.json"), "0x07306aCcCB482C8619e7ed119dAA2BDF2b4389D0");
    unic = erc20("UNIC", "0x94E0BAb2F6Ab1F19F4750E42d7349f2740513aD5");
    xunic = erc20("xUNIC", "0xA62fB0c2Fb3C7b27797dC04e1fEA06C0a2Db919a");
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

    getName = () => ``;

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
        this.oracle.valueOf(this.getNetwork().id, this.strategy.asset, this.data.amountAsset),
        this.oracle.valueOf(this.getNetwork().id, this.eth, this.data.amountETH),
        this.oracle.valueOf(this.getNetwork().id, this.unic, this.data.rewardAmount.mul(bn(xunicrate)).div(ether)),
        this.oracle.valueOf(this.getNetwork().id, this.eth, bn(r1).muln(2).mul(bn(poolInfo.totalLPTokens)).div(bn(totalSupply))),
      ]);
    }

    getContractMethods = () => _.functions(this.xfarm.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.xfarm.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.xfarm.methods as any)[method](...args);
      alert(`target:\n${this.xfarm.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.xfarm.methods.deposit(this.strategy.poolId, 0), useLegacyTx);
    }
  }
}
