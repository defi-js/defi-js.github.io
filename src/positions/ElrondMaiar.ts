import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, ether, fmt18, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import {
  AbiRegistry,
  Address,
  BigUIntType,
  BigUIntValue,
  BinaryCodec,
  ContractFunction,
  ContractInterface,
  EndpointDefinition,
  EnumType,
  ProxyProvider,
  Query,
  ScArgumentsParser,
  SmartContract,
  SmartContractAbi,
  Struct,
  StructField,
  StructFieldDefinition,
  StructType,
  TokenIdentifierType,
  U64Type,
} from "@elrondnetwork/erdjs/out";
import _ from "lodash";
import { ContractWrapper } from "@elrondnetwork/erdjs/out/smartcontracts/wrapper/contractWrapper";
import BigNumber from "bignumber.js";
import { StructBinaryCodec } from "@elrondnetwork/erdjs/out/smartcontracts/codec/struct";

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

  const provider = new ProxyProvider("https://gateway.elrond.com", { timeout: 60 * 1000 });

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
      const account = new Address(this.args.address);
      const esdts = await provider.getAddressEsdtList(account);
      const farmNfts = _.filter(esdts, (v) => v.tokenIdentifier.startsWith(EGLDUSDCF));
      const balanceEGLD = bn((await provider.getAccount(account)).balance.toString());

      const farm = new SmartContract({ address: new Address(EGLDUSDC_FARM_ADDRESS) });
      const lpReserve = base64((await farm.runQuery(provider, { func: new ContractFunction("getFarmingTokenReserve") })).returnData[0]);
      const farmNftSupply = base64((await farm.runQuery(provider, { func: new ContractFunction("getFarmTokenSupply") })).returnData[0]);
      const farmNftBalance = farmNfts.map((nft) => bn(nft.balance)).reduce((sum, b) => sum.add(b), zero);
      const farmNftPercentOfSupply = farmNftBalance.mul(ether).div(farmNftSupply);
      const lpReserveBalance = lpReserve.mul(farmNftPercentOfSupply).div(ether);

      console.log("lpReserve", fmt18(lpReserve));
      console.log("farmNftSupply", fmt18(farmNftSupply));
      console.log("farmNftBalance", fmt18(farmNftBalance));
      console.log("farmNftPercentOfSupply", fmt18(farmNftPercentOfSupply));
      console.log("lpReserveBalance", fmt18(lpReserveBalance));

      const pair = new SmartContract({ address: new Address(EGLD_USDC_POOL_ADDRESS) });

      //pub struct EsdtTokenPayment<BigUint: BigUintApi> {
      //     pub token_type: EsdtTokenType,
      //     pub token_name: TokenIdentifier,
      //     pub token_nonce: u64,
      //     pub amount: BigUint,
      // }
      //pub enum EsdtTokenType {
      //     Fungible,
      //     NonFungible,
      //     SemiFungible,
      //     Meta,
      //     Invalid,
      // }

      const tokensForPositionRaw = await pair.runQuery(provider, {
        func: new ContractFunction("getTokensForGivenPosition"),
        args: [new BigUIntValue(BigNumber.sum(lpReserveBalance.toString()))],
      });
      console.log(tokensForPositionRaw);

      console.log("base64", base64(tokensForPositionRaw.returnData[0]).toString(16));
    }

    getContractMethods = () => [];

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }
}

function base64(s: string) {
  return bn(Buffer.from(s, "base64").toString("hex"), 16);
}
function base64Str(s: string) {
  return Buffer.from(s, "base64").toString("utf8");
}
