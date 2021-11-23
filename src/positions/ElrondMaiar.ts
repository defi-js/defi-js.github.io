import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import { Address, ContractFunction, ProxyProvider, Query } from "@elrondnetwork/erdjs/out";
import _ from "lodash";

const ZERO_ADDRESS = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
const ESDT_ISSUE_ADDRESS = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";
const LOCKED_ASSET_FACTORY_ADDRESS = "erd1qqqqqqqqqqqqqpgqjpt0qqgsrdhp2xqygpjtfrpwf76f9nvg2jpsg4q7th";
const ROUTE_ADDRESS = "erd1qqqqqqqqqqqqqpgqq66xk9gfr4esuhem3jru86wg5hvp33a62jps2fy57p";
const EGLD_MEX_POOL_ADDRESS = "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2";
const EGLD_USDC_POOL_ADDRESS = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq";
const EGLDMEX_FARM_ADDRESS = "erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh";
const EGLDUSDC_FARM_ADDRESS = "erd1qqqqqqqqqqqqqpgqsw9pssy8rchjeyfh8jfafvl3ynum0p9k2jps6lwewp";
const MEX_FARM_ADDRESS = "erd1qqqqqqqqqqqqqpgqv4ks4nzn2cw96mm06lt7s2l3xfrsznmp2jpsszdry5";
const PROXY_ADDRESS = "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl";

const MEX_TOKEN = "MEX-455c57";
const LKMEX_TOKEN = "LKMEX-aab910";
const WEGLD_TOKEN = "WEGLD-bd4d79";
const USDC_TOKEN = "USDC-c76f1f";

const EGLDMEXLP = "EGLDMEX-0be9e5";
const EGLDUSDCLP = "EGLDUSDC-594e5e";
const EGLDMEXF = "EGLDMEXF-5bcc57";
const EGLDUSDCF = "EGLDUSDCF-8600f8";
const MEXFARM = "MEXFARM-e7af52";
const LOCKED_LP = "LKLP-03a2fa";
const LOCKED_FARM = "LKFARM-9d1ea8";

const WEGLD_SHARD0 = "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy";
const WEGLD_SHARD1 = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3";
const WEGLD_SHARD2 = "erd1qqqqqqqqqqqqqpgqmuk0q2saj0mgutxm4teywre6dl8wqf58xamqdrukln";

export namespace ElrondMaiar {
  export type ESDT = Token & { esdt: true; tokenId: string };

  function esdt(name: string, tokenId: string): ESDT {
    const result = erc20(name, zeroAddress) as ESDT;
    result.esdt = true;
    result.tokenId = tokenId;
    return result;
  }

  export const tokens = {
    EGLD: () => esdt("EGLD", WEGLD_TOKEN),
    USDC: () => esdt("USDC", USDC_TOKEN),
    MEX: () => esdt("MEX", MEX_TOKEN),
  };

  const provider = new ProxyProvider("https://gateway.elrond.com");

  export class Farm implements Position {
    data = {
      rewardAmount: zero,
      rewardValue: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public assets: ESDT[]) {
      if (!_.every(assets, (a) => a.esdt)) throw new Error(`only ESDT tokens: ${assets}`);
    }

    getArgs = () => this.args;

    getNetwork = () => ({ id: -508, name: "Elrond", shortname: "egld" });

    getAssets = () => this.assets;

    getRewardAssets = () => [tokens.MEX()];

    getData = () => this.data;

    getHealth = () => [];

    getAmounts() {
      return [];
    }

    getPendingRewards() {
      return [];
    }

    async load() {
      const result = await provider.getAddressEsdtList(new Address(this.args.address));
      const farmNfts = _.filter(result, (v) => v.tokenIdentifier.startsWith(EGLDUSDCF));
      console.log("farmNfts", farmNfts);
      const nfts = await provider.getAddressNft(new Address(this.args.address), EGLDUSDCF, farmNfts[0].nonce);
      console.log("nfts", nfts);

      // await provider.getAddressNft(new Address(this.args.address), result.)

      //query ($days: Int!, $mexID: String!, $wegldID: String!, $offset: Int, $pairsLimit: Int) {
      //   totalAggregatedRewards(days: $days)
      //   wegldPriceUSD: getTokenPriceUSD(tokenID: $wegldID)
      //   mexPriceUSD: getTokenPriceUSD(tokenID: $mexID)
      //   mexSupply: totalTokenSupply(tokenID: $mexID)
      //   totalLockedValueUSDFarms
      //   totalValueLockedUSD
      //   farms {
      //     address
      //     APR
      //     farmingToken {
      //       name
      //       identifier
      //       decimals
      //       __typename
      //     }
      //     farmTokenPriceUSD
      //     farmedTokenPriceUSD
      //     farmingTokenPriceUSD
      //     farmingTokenReserve
      //     perBlockRewards
      //     penaltyPercent
      //     totalValueLockedUSD
      //     __typename
      //   }
      //   pairs(offset: $offset, limit: $pairsLimit) {
      //     address
      //     firstToken {
      //       name
      //       identifier
      //       decimals
      //       __typename
      //     }
      //     secondToken {
      //       name
      //       identifier
      //       decimals
      //       __typename
      //     }
      //     firstTokenPrice
      //     firstTokenPriceUSD
      //     secondTokenPrice
      //     secondTokenPriceUSD
      //     liquidityPoolTokenPriceUSD
      //     info {
      //       reserves0
      //       reserves1
      //       totalSupply
      //       __typename
      //     }
      //     state
      //     lockedValueUSD
      //     __typename
      //   }
      //   factory {
      //     totalVolumeUSD24h
      //     __typename
      //   }
      // }
      //
      // return await Promise.all(
      //   this.assets.map(async (asset) => {
      //     const amount = bn(_.get(result, [asset.tokenId, "balance"], 0));
      //     const value = await this.oracle.valueOf(asset, amount);
      //     return { asset, amount, value };
      //   })
      // );
    }

    async claim(useLegacyTx: boolean) {}
  }
}
