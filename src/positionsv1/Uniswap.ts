import { Network, PositionArgs, PositionV1, Severity } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { bn, contract, erc20, maxUint256, Token, web3, zero } from "@defi.org/web3-candies";
import { PositionFactory } from "./base/PositionFactory";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import type { UniswapNftManagerAbi, UniswapV2Abi, UniswapV2FactoryAbi, UniswapV3FactoryAbi } from "../../typechain-abi";
import _ from "lodash";

const maxUint128 = bn(2).pow(bn(128)).minus(1).toString();

export namespace Uniswap {
  export function register() {
    PositionFactory.register({
      "eth:Uniswap:V2LP:USDC/ETH": (args, oracle) => new V2LP(args, oracle, erc20s.eth.USDC(), erc20s.eth.WETH()),

      "eth:Uniswap:V3LP:WBTC/ETH": (args, oracle) => new V3LP(args, oracle, networks.eth, erc20s.eth.WBTC(), erc20s.eth.WETH()),
      "eth:Uniswap:V3LP:USDC/ETH": (args, oracle) => new V3LP(args, oracle, networks.eth, erc20s.eth.USDC(), erc20s.eth.WETH()),
      "eth:Uniswap:V3LP:TON/ETH": (args, oracle) => new V3LP(args, oracle, networks.eth, erc20("TON", "0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1"), erc20s.eth.WETH()),

      "arb:Uniswap:V3LP:WBTC/ETH": (args, oracle) => new V3LP(args, oracle, networks.arb, erc20("WBTC", "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"), erc20s.arb.WETH()),

      "poly:Uniswap:V3LP:MATIC/ETH": (args, oracle) => new V3LP(args, oracle, networks.poly, erc20s.poly.WMATIC(), erc20s.poly.WETH()),

      "oeth:Uniswap:V3LP:WBTC/ETH": (args, oracle) => new V3LP(args, oracle, networks.oeth, erc20s.oeth.WETH(), erc20s.oeth.WBTC()),
    });
  }

  class V3LP implements PositionV1 {
    nftPositionManager = contract<UniswapNftManagerAbi>(require("../abi/UniswapNftManagerAbi.json"), "0xC36442b4a4522E871399CD717aBDD847Ab11FE88");

    data = {
      nftManager: this.nftPositionManager.options.address,
      id: 0,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      tvl: zero,
      principal0: zero,
      principal1: zero,
      valueIfHodl: zero,
      valueNow: zero,
      ilValue: zero,
      il: zero,
      pending0: zero,
      pending1: zero,
      pendingValue0: zero,
      pendingValue1: zero,
      totalFeesValue: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public token0: Token, public token1: Token) {
      this.data.id = parseInt(args.input!) || 0;
      if (this.data.id <= 0) throw new Error("unknown positionId");
    }

    getName = () => "";
    getNetwork = () => this.network;
    getArgs = () => this.args;
    getData = () => this.data;
    getTVL = () => this.data.tvl;
    getAssets = () => [this.token0, this.token1];
    getAmounts = () => [
      { asset: this.token0, amount: this.data.amount0, value: this.data.value0 },
      { asset: this.token1, amount: this.data.amount1, value: this.data.value1 },
    ];
    getRewardAssets = () => [this.token0, this.token1];
    getPendingRewards = () => [
      { asset: this.token0, amount: this.data.pending0, value: this.data.pendingValue0 },
      { asset: this.token1, amount: this.data.pending1, value: this.data.pendingValue1 },
    ];
    getHealth = () => {
      if (this.data.value0.isZero() || this.data.value1.isZero())
        return [
          {
            severity: Severity.High,
            message: "Range",
          },
        ];
      if (!this.data.totalFeesValue.isZero() && this.data.ilValue.gt(this.data.totalFeesValue))
        return [
          {
            severity: Severity.High,
            message: "IL",
          },
        ];
      return [];
    };

    async load() {
      const pos = await this.nftPositionManager.methods.positions(this.data.id).call();
      if (web3().utils.toChecksumAddress(pos.token0) !== web3().utils.toChecksumAddress(this.token0.address)) throw new Error(`invalid tokens for pos, ${JSON.stringify(pos)}`);

      const res = await this.nftPositionManager.methods.decreaseLiquidity([this.data.id, pos.liquidity, 0, 0, maxUint256]).call({ from: this.args.address });
      this.data.amount0 = await this.token0.mantissa(res.amount0);
      this.data.amount1 = await this.token1.mantissa(res.amount1);

      [this.data.value0, this.data.value1] = await Promise.all([
        this.oracle.valueOf(this.network.id, this.token0, this.data.amount0),
        this.oracle.valueOf(this.network.id, this.token1, this.data.amount1),
      ]);

      if (this.getNetwork().id === networks.eth.id) await this.loadFromPositionGraph();

      if (this.data.tvl.isZero()) await this.loadTVL(parseInt(pos.fee));
    }

    getContractMethods = () => _.functions(this.nftPositionManager.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.nftPositionManager.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.nftPositionManager.methods as any)[method](...args);
      alert(`target:\n${this.nftPositionManager.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      await sendWithTxType(this.nftPositionManager.methods.collect([this.data.id, this.args.address, maxUint128, maxUint128]), useLegacyTx);
    }

    async loadFromPositionGraph() {
      const response = await fetch("https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3", {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          query: `{position(id:${this.data.id}) {
          depositedToken0
          depositedToken1
          withdrawnToken0
          withdrawnToken1
          collectedFeesToken0
          collectedFeesToken1
          pool {
            id
            totalValueLockedUSD
          }
        }
      }`,
        }),
        method: "POST",
      });
      const json = await response.json();

      this.data.tvl = bn(json.data.position.pool.totalValueLockedUSD);
      this.data.principal0 = bn(json.data.position.depositedToken0).minus(bn(json.data.position.withdrawnToken0));
      this.data.principal1 = bn(json.data.position.depositedToken1).minus(bn(json.data.position.withdrawnToken1));

      const [principalValue0, principalValue1] = await Promise.all([
        this.oracle.valueOf(this.network.id, this.token0, this.data.principal0),
        this.oracle.valueOf(this.network.id, this.token1, this.data.principal1),
      ]);
      this.data.valueIfHodl = principalValue0.plus(principalValue1);
      this.data.valueNow = this.data.value0.plus(this.data.value1);
      this.data.ilValue = this.data.valueIfHodl.minus(this.data.valueNow);
      this.data.il = bn(1).minus(this.data.valueNow.div(this.data.valueIfHodl));
      const pending = await this.nftPositionManager.methods.collect([this.data.id, this.args.address, maxUint128, maxUint128]).call({ from: this.args.address });
      this.data.pending0 = await this.token0.mantissa(pending.amount0);
      this.data.pending1 = await this.token1.mantissa(pending.amount1);
      this.data.pendingValue0 = await this.oracle.valueOf(this.getNetwork().id, this.token0, this.data.pending0);
      this.data.pendingValue1 = await this.oracle.valueOf(this.getNetwork().id, this.token1, this.data.pending1);
      const collectedValue0 = await this.oracle.valueOf(this.getNetwork().id, this.token0, bn(json.data.position.collectedFeesToken0));
      const collectedValue1 = await this.oracle.valueOf(this.getNetwork().id, this.token1, bn(json.data.position.collectedFeesToken1));

      this.data.totalFeesValue = this.data.pendingValue0.plus(this.data.pendingValue1).plus(collectedValue0).plus(collectedValue1);
    }

    async loadTVL(fee: number) {
      const factory = contract<UniswapV3FactoryAbi>(require("../abi/UniswapV3FactoryAbi.json"), await this.nftPositionManager.methods.factory().call());
      const pool = await factory.methods.getPool(this.token0.address, this.token1.address, fee).call();
      const [a0, a1] = await Promise.all([
        this.token0.methods.balanceOf(pool).call().then(this.token0.mantissa),
        this.token1.methods.balanceOf(pool).call().then(this.token1.mantissa),
      ]);
      const [v0, v1] = await Promise.all([this.oracle.valueOf(this.network.id, this.token0, a0), this.oracle.valueOf(this.network.id, this.token1, a1)]);
      this.data.tvl = v0.plus(v1);
    }
  }

  class V2LP implements PositionV1 {
    router = contract<UniswapV2Abi>(require("../abi/UniswapV2Abi.json"), "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
    data = {
      router: this.router.options.address,
      pair: "",
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token) {}

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.eth;
    getAssets = () => [this.asset0, this.asset1];
    getRewardAssets = () => [];
    getData = () => this.data;
    getHealth = () => [];
    getPendingRewards = () => [];
    getTVL = () => this.data.tvl;
    getAmounts = () => [
      { asset: this.asset0, amount: this.data.amount0, value: this.data.value0 },
      { asset: this.asset1, amount: this.data.amount1, value: this.data.value1 },
    ];

    async load() {
      const factoryAddress = await this.router.methods.factory().call();
      const factory = contract<UniswapV2FactoryAbi>(require("../abi/UniswapV2FactoryAbi.json"), factoryAddress);
      this.data.pair = await factory.methods.getPair(this.asset0.address, this.asset1.address).call();
      const lpToken = erc20("LP", this.data.pair);

      const [lpAmount, lpTotalSupply, total0, total1] = await Promise.all([
        lpToken.methods.balanceOf(this.args.address).call().then(bn),
        lpToken.methods.totalSupply().call().then(bn),
        this.asset0.methods
          .balanceOf(lpToken.options.address)
          .call()
          .then((t) => this.asset0.mantissa(t)),
        this.asset1.methods
          .balanceOf(lpToken.options.address)
          .call()
          .then((t) => this.asset1.mantissa(t)),
      ]);

      this.data.amount0 = total0.times(lpAmount).div(lpTotalSupply);
      this.data.amount1 = total1.times(lpAmount).div(lpTotalSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);
      this.data.tvl = (await this.oracle.valueOf(this.getNetwork().id, this.asset0, total0)).plus(await this.oracle.valueOf(this.getNetwork().id, this.asset1, total1));
    }

    getContractMethods = () => _.functions(this.router.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.router.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.router.methods as any)[method](...args);
      alert(`target:\n${this.router.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {}
  }
}
