import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn18, contract, ether, maxUint256, Network, Token, web3, zero } from "@defi.org/web3-candies";
import { PositionFactory } from "./base/PositionFactory";
import { erc20s, networks } from "./base/consts";
import type { UniswapNftManagerAbi } from "../../typechain-abi/UniswapNftManagerAbi";

export namespace Uniswap {
  export function register() {
    PositionFactory.register({
      "eth:Uniswap:V3LP:WBTC/ETH": (args, oracle) => new V3LP(args, oracle, networks.eth, erc20s.eth.WBTC(), erc20s.eth.WETH()),
    });
  }

  class V3LP implements Position {
    nftPositionManager = contract<UniswapNftManagerAbi>(require("../abi/UniswapNftManagerAbi.json"), "0xC36442b4a4522E871399CD717aBDD847Ab11FE88");

    data = {
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
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public token0: Token, public token1: Token) {
      this.data.id = parseInt(args.input!);
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
    getRewardAssets = () => [];
    getPendingRewards = () => []; // TODO pending fees
    getHealth = () => [];

    async load() {
      const pos = await this.nftPositionManager.methods.positions(this.data.id).call();
      if (web3().utils.toChecksumAddress(pos.token0) !== web3().utils.toChecksumAddress(this.token0.address)) throw new Error(`invalid tokens for pos, ${pos}`);

      const res = await this.nftPositionManager.methods.decreaseLiquidity([this.data.id, pos.liquidity, 0, 0, maxUint256]).call();
      this.data.amount0 = await this.token0.mantissa(res.amount0);
      this.data.amount1 = await this.token1.mantissa(res.amount1);

      [this.data.value0, this.data.value1] = await Promise.all([
        this.oracle.valueOf(this.network.id, this.token0, this.data.amount0),
        this.oracle.valueOf(this.network.id, this.token1, this.data.amount1),
      ]);

      const graph = await positionGraph(this.data.id);
      this.data.tvl = graph.tvl;
      this.data.principal0 = graph.principal0;
      this.data.principal1 = graph.principal1;

      const [principalValue0, principalValue1] = await Promise.all([
        this.oracle.valueOf(this.network.id, this.token0, this.data.principal0),
        this.oracle.valueOf(this.network.id, this.token1, this.data.principal1),
      ]);
      this.data.valueIfHodl = principalValue0.add(principalValue1);
      this.data.valueNow = this.data.value0.add(this.data.value1);
      this.data.ilValue = this.data.valueIfHodl.sub(this.data.valueNow);
      this.data.il = this.data.valueIfHodl.mul(ether).div(this.data.valueNow).sub(ether);
    }

    getContractMethods = () => []; // TODO
    async callContract(method: string, args: string[]) {}
    async harvest(useLegacyTx: boolean) {} // TODO claim fees
    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}
  }
}

async function positionGraph(posId: number) {
  const response = await fetch("https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `{position(id:${posId}) {
          depositedToken0
          depositedToken1
          withdrawnToken0
          withdrawnToken1
          collectedFeesToken0
          collectedFeesToken1
          pool {
            totalValueLockedUSD
          }
        }
      }`,
    }),
    method: "POST",
  });
  const json = await response.json();
  return {
    tvl: bn18(json.data.position.pool.totalValueLockedUSD),
    principal0: bn18(json.data.position.depositedToken0).sub(bn18(json.data.position.withdrawnToken0)),
    principal1: bn18(json.data.position.depositedToken1).sub(bn18(json.data.position.withdrawnToken1)),
    collectedFees0: bn18(json.data.position.collectedFeesToken0),
    collectedFees1: bn18(json.data.position.collectedFeesToken1),
  };
}
