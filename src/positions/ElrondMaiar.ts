import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, ether, to18, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import { Address, ContractFunction, ProxyProvider, SmartContract } from "@elrondnetwork/erdjs/out";
import _ from "lodash";

export namespace ElrondMaiar {
  export const network = { id: -508, name: "Elrond", shortname: "egld" };

  const provider = new ProxyProvider("https://gateway.elrond.com", { timeout: 60 * 1000 });

  export type ESDT = Token & { esdt: true; tokenId: string; dec: number };

  const tokens = {
    EGLD: () => esdt("EGLD", "WEGLD-bd4d79", 18),
    USDC: () => esdt("USDC", "USDC-c76f1f", 6),
    MEX: () => esdt("MEX", "MEX-455c57", 18),
    LKMEX: () => esdt("LKMEX", "LKMEX-aab910", 18),
  };

  export type Strategy = { assets: ESDT[]; pool: string; farm: string };
  export const Strategies = {
    USDC_EGLD: () => ({
      assets: [tokens.USDC(), tokens.EGLD()],
      pool: "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq",
      farm: "erd1qqqqqqqqqqqqqpgqsw9pssy8rchjeyfh8jfafvl3ynum0p9k2jps6lwewp",
    }),
    MEX_EGLD: () => ({
      assets: [tokens.MEX(), tokens.EGLD()],
      pool: "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
      farm: "erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh",
    }),
  };

  export class Farm implements Position {
    data = {
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      balanceEGLD: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public strategy: Strategy) {}

    getArgs = () => this.args;

    getNetwork = () => network;

    getAssets = () => this.strategy.assets;

    getRewardAssets = () => [tokens.MEX()];

    getData = () => this.data;

    getHealth = () => [];

    getAmounts = () => [
      {
        asset: this.strategy.assets[0],
        amount: this.data.amount0,
        value: this.data.value0,
      },
      {
        asset: this.strategy.assets[1],
        amount: this.data.amount1,
        value: this.data.value1,
      },
    ];

    getPendingRewards = () => [];

    getTVL = () => this.data.tvl;

    async load() {
      const account = new Address(this.args.address);
      const pair = new SmartContract({ address: new Address(this.strategy.pool) });
      const farm = new SmartContract({ address: new Address(this.strategy.farm) });

      const [balanceEGLD, esdts, lpTotalStakedInFarm, farmNftTotalSupply, token0Id, reserves] = await Promise.all([
        provider.getAccount(account).then((r) => bn(r.balance.toString())),
        provider.getAddressEsdtList(account),
        call(farm, "getFarmingTokenReserve").then((r) => base64(r[0])),
        call(farm, "getFarmTokenSupply").then((r) => base64(r[0])),
        call(pair, "getFirstTokenId").then((r) => r[0]),
        call(pair, "getReservesAndTotalSupply").then((r) => r.map(base64)),
      ]);
      this.data.balanceEGLD = balanceEGLD;

      const farmNfts = _.filter(esdts, (v) => v.creator === this.strategy.farm);
      const farmNftBalance = farmNfts.map((nft) => bn(nft.balance)).reduce((sum, b) => sum.add(b), zero);
      const farmNftPercentOfSupply = farmNftBalance.mul(ether).div(farmNftTotalSupply);
      const lpBalance = lpTotalStakedInFarm.mul(farmNftPercentOfSupply).div(ether);

      const [token0r, token1r, totalSupply] = reserves;
      const percentOfPool = lpBalance.mul(ether).div(totalSupply);
      const token0 = to18(this.strategy.assets[0].tokenId === token0Id[0] ? token0r : token1r, this.strategy.assets[0].dec);
      const token1 = to18(this.data.amount0 === token0r ? token1r : token0r, this.strategy.assets[1].dec);
      this.data.amount0 = percentOfPool.mul(token0).div(ether);
      this.data.amount1 = percentOfPool.mul(token1).div(ether);
      [this.data.value0, this.data.value1, this.data.tvl] = await Promise.all([
        this.oracle.valueOf(this.strategy.assets[0], this.data.amount0),
        this.oracle.valueOf(this.strategy.assets[1], this.data.amount1),
        this.oracle.valueOf(this.strategy.assets[0], token0.muln(2).mul(lpTotalStakedInFarm).div(totalSupply)),
      ]);
    }

    getContractMethods = () => [];

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }

  function esdt(name: string, tokenId: string, decimals: number): ESDT {
    const result = erc20(name, zeroAddress) as ESDT;
    result.esdt = true;
    result.tokenId = tokenId;
    result.dec = decimals;
    return result;
  }

  function base64(s: string) {
    return bn(Buffer.from(s, "base64").toString("hex"), 16);
  }

  function base64Str(s: string) {
    return Buffer.from(s, "base64").toString("utf8");
  }

  function call(contract: SmartContract, fn: string) {
    return contract.runQuery(provider, { func: new ContractFunction(fn) }).then((r) => r.returnData);
  }
}

// const ZERO_ADDRESS = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
// const ESDT_ISSUE_ADDRESS = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";
// const LOCKED_ASSET_FACTORY_ADDRESS = "erd1qqqqqqqqqqqqqpgqjpt0qqgsrdhp2xqygpjtfrpwf76f9nvg2jpsg4q7th";
// const ROUTE_ADDRESS = "erd1qqqqqqqqqqqqqpgqq66xk9gfr4esuhem3jru86wg5hvp33a62jps2fy57p";
// const MEXEGLD_POOL_ADDRESS = "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2";
// const USDCEGLD_POOL_ADDRESS = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq";
// const MEXEGLD_FARM_ADDRESS = "erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh";
// const USDCEGLD_FARM_ADDRESS = "erd1qqqqqqqqqqqqqpgqsw9pssy8rchjeyfh8jfafvl3ynum0p9k2jps6lwewp";
// const MEX_FARM_ADDRESS = "erd1qqqqqqqqqqqqqpgqv4ks4nzn2cw96mm06lt7s2l3xfrsznmp2jpsszdry5";
// const PROXY_ADDRESS = "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl";
// const MEX_TOKEN = "MEX-455c57";
// const LKMEX_TOKEN = "LKMEX-aab910";
// const WEGLD_TOKEN = "WEGLD-bd4d79";
// const USDC_TOKEN = "USDC-c76f1f";
// const EGLDMEXLP = "EGLDMEX-0be9e5";
// const EGLDUSDCLP = "EGLDUSDC-594e5e";
// const EGLDMEXF = "EGLDMEXF-5bcc57";
// const EGLDUSDCF = "EGLDUSDCF-8600f8";
// const MEXFARM = "MEXFARM-e7af52";
// const LOCKED_LP = "LKLP-03a2fa";
// const LOCKED_FARM = "LKFARM-9d1ea8";
// const WEGLD_SHARD0 = "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy";
// const WEGLD_SHARD1 = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3";
// const WEGLD_SHARD2 = "erd1qqqqqqqqqqqqqpgqmuk0q2saj0mgutxm4teywre6dl8wqf58xamqdrukln";
