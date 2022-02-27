import _ from "lodash";
import BN from "bn.js";
import { Position, PositionArgs, TokenAmount } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, ether, to18, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import {
  Address,
  BigUIntType,
  BigUIntValue,
  BinaryCodec,
  BytesValue,
  ContractFunction,
  ProxyProvider,
  SmartContract,
  StructType,
  TokenIdentifierType,
  U64Type,
} from "@elrondnetwork/erdjs";
import BigNumberExt from "bignumber.js";
import { BooleanType, StructFieldDefinition, U8Type } from "@elrondnetwork/erdjs/out";

export namespace ElrondMaiar {
  export const network = { id: -508, name: "Elrond", shortname: "egld" };

  const provider = new ProxyProvider("https://gateway.elrond.com", { timeout: 60 * 1000 });

  export type ESDT = Token & { esdt: true; tokenId: string; dec: number };

  const tokens = {
    EGLD: () => esdt("WEGLD", "WEGLD-bd4d79", 18),
    USDC: () => esdt("USDC", "USDC-c76f1f", 6),
    MEX: () => esdt("MEX", "MEX-455c57", 18),
    RIDE: () => esdt("RIDE", "RIDE-7d18e9", 18),
    LKMEX: () => esdt("LKMEX", "LKMEX-aab910", 18),

    LKFARM: () => esdt("LKFARM", "LKFARM-9d1ea8", 18),
    EGLD_MEX_FARM: () => esdt("EGLDMEXF", "EGLDMEXF-5bcc57", 18),
    MEX_POOL_NFT: () => esdt("MEX Pool NFT", "MEXFARM-e7af52", 18),
    RIDE_POOL_NFT: () => esdt("RIDE Pool NFT", "MEXRIDEF-bf0320", 18),
  };

  export async function balances(oracle: PriceOracle, address: string): Promise<TokenAmount[]> {
    const assets = _.map(tokens, (t) => t());

    const [esdts, balanceEGLD] = await Promise.all([
      provider.getAddressEsdtList(new Address(address)),
      provider.getAccount(new Address(address)).then((r) => bn(r.balance.toString())),
    ]);

    const balances = await Promise.all(
      _(esdts)
        .map((e) => ({ asset: _.find(assets, (asset) => e.tokenIdentifier === asset.tokenId), esdt: e }))
        .filter((t) => !!t.asset)
        .map(async (t) => {
          const amount = to18(t.esdt.balance, t.asset!.dec);
          return {
            asset: t.asset!,
            amount,
            value: await oracle.valueOf(network.id, t.asset!, amount),
          };
        })
        .value()
    );

    balances.push({ asset: esdt("EGLD", "", 18), amount: balanceEGLD, value: await oracle.valueOf(network.id, tokens.EGLD(), balanceEGLD) });

    return balances;
  }

  export type Strategy = { assets: ESDT[]; pool: string; farm: string };

  export const FarmStrategies = {
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
    mex = tokens.MEX();

    data = {
      lpBalanceStaked: zero,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public strategy: Strategy) {}

    getName = () => ``;

    getArgs = () => this.args;

    getNetwork = () => network;

    getAssets = () => this.strategy.assets;

    getRewardAssets = () => [this.mex];

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

    getPendingRewards = () => [{ asset: this.mex, amount: this.data.rewardAmount, value: this.data.rewardValue }];

    getTVL = () => this.data.tvl;

    async load() {
      const account = new Address(this.args.address);
      const pair = new SmartContract({ address: new Address(this.strategy.pool) });
      const farm = new SmartContract({ address: new Address(this.strategy.farm) });

      const [esdts, farmingTokenReserve, token0Id, reserves] = await Promise.all([
        provider.getAddressEsdtList(account),
        call(farm, "getFarmingTokenReserve").then((r) => base64(r[0])),
        call(pair, "getFirstTokenId").then((r) => r[0]),
        call(pair, "getReservesAndTotalSupply").then((r) => r.map(base64)),
      ]);
      const [token0r, token1r, lpTotalSupply] = reserves;

      const farmNfts = _.filter(esdts, (v) => v.creator === this.strategy.farm);
      if (!farmNfts.length) return;

      this.data.lpBalanceStaked = farmNfts.map((nft) => parseLPFromFarmTokenAttr(nft.attributes)).reduce((sum, b) => sum.add(b), zero);

      this.data.rewardAmount = await Promise.all(farmNfts.map((nft) => callAndParseGetPendingRewards(farm, nft.balance, nft.attributes))).then((r) =>
        r.reduce((sum, r) => sum.add(r), zero)
      );

      const percentOfPool = this.data.lpBalanceStaked.mul(ether).div(lpTotalSupply);
      const token0 = to18(this.strategy.assets[0].tokenId === token0Id[0] ? token0r : token1r, this.strategy.assets[0].dec);
      const token1 = to18(this.data.amount0 === token0r ? token1r : token0r, this.strategy.assets[1].dec);
      this.data.amount0 = percentOfPool.mul(token0).div(ether);
      this.data.amount1 = percentOfPool.mul(token1).div(ether);
      [this.data.value0, this.data.value1, this.data.tvl, this.data.rewardValue] = await Promise.all([
        this.oracle.valueOf(network.id, this.strategy.assets[0], this.data.amount0),
        this.oracle.valueOf(network.id, this.strategy.assets[1], this.data.amount1),
        this.oracle.valueOf(network.id, this.strategy.assets[1], token1.muln(2).mul(farmingTokenReserve).div(lpTotalSupply)),
        this.oracle.valueOf(network.id, this.mex, this.data.rewardAmount),
      ]);
    }

    getContractMethods = () => [];

    async callContract(method: string, args: string[]) {}

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }

  export type MexPoolStrategy = Strategy & { nft: ESDT; reward: ESDT };
  export const MexFarmStrategies = {
    MEX: () => ({
      assets: [tokens.MEX()],
      pool: "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl",
      farm: "erd1qqqqqqqqqqqqqpgqv4ks4nzn2cw96mm06lt7s2l3xfrsznmp2jpsszdry5",
      nft: tokens.MEX_POOL_NFT(),
      reward: tokens.MEX(),
    }),
    RIDE: () => ({
      assets: [tokens.MEX()],
      pool: "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl",
      farm: "erd1qqqqqqqqqqqqqpgq5e2m9df5yxxkmr86rusejc979arzayjk2jpsz2q43s",
      nft: tokens.RIDE_POOL_NFT(),
      reward: tokens.RIDE(),
    }),
  };

  export class MexFarm extends Farm {
    getRewardAssets = () => [(this.strategy as MexPoolStrategy).reward];

    getPendingRewards = () => [{ asset: this.mex, amount: this.data.rewardAmount, value: this.data.rewardValue }];

    override async load() {
      const account = new Address(this.args.address);
      const proxy = new SmartContract({ address: new Address(this.strategy.pool) });
      const farm = new SmartContract({ address: new Address(this.strategy.farm) });
      const farmNft = (this.strategy as MexPoolStrategy).nft;
      const asset = this.getAssets()[0];

      let totalAssetStaked = await call(farm, "getFarmingTokenReserve")
        .then((r) => base64(r[0]))
        .catch(() => zero);
      if (totalAssetStaked.isZero()) {
        const farmEsdts = await provider.getAddressEsdtList(farm.getAddress());
        totalAssetStaked = bn(_.find(farmEsdts, (e) => e.tokenIdentifier === asset.tokenId)!.balance);
      }
      this.data.tvl = await this.oracle.valueOf(network.id, asset, totalAssetStaked);

      const esdts = await provider.getAddressEsdtList(account);
      const farmNftWrapper = _.find(esdts, (e) => e.creator === proxy.getAddress().toString() && e.tokenIdentifier.startsWith(tokens.LKFARM().tokenId));
      if (!farmNftWrapper) return;
      this.data.amount0 = parsePrincipalAmountFromWrappedFarmTokenAttr(farmNftWrapper.attributes, farmNft);
      this.data.value0 = await this.oracle.valueOf(network.id, asset, this.data.amount0);

      this.data.rewardAmount = await callAndParseGetPendingRewards(farm, farmNftWrapper.balance, farmNftWrapper.attributes);
      this.data.rewardValue = await this.oracle.valueOf(network.id, this.getRewardAssets()[0], this.data.rewardAmount);
    }
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

  function call(contract: SmartContract, fn: string) {
    return contract.runQuery(provider, { func: new ContractFunction(fn) }).then((r) => r.returnData);
  }

  async function callAndParseGetPendingRewards(farm: SmartContract, balanceFarmNFT: BN, attributes: string) {
    const result = await farm.runQuery(provider, {
      func: new ContractFunction("calculateRewardsForGivenPosition"),
      args: [new BigUIntValue(BigNumberExt.max(balanceFarmNFT.toString())), new BytesValue(Buffer.from(attributes, "base64"))],
    });
    if (result.returnData.length) return base64(result.returnData[0]);

    return zero;
  }

  function parseLPFromFarmTokenAttr(attributes: string) {
    const [struct] = codec.decodeNested(Buffer.from(attributes, "base64"), typeFarmTokenAttributes);
    const data = struct.valueOf();
    return bn((data.initial_farming_amount as BigNumberExt).toString(16), 16);
  }

  function parsePrincipalAmountFromWrappedFarmTokenAttr(attributes: string, asset: ESDT) {
    const [struct] = codec.decodeNested(Buffer.from(attributes, "base64"), typeWrappedFarmTokenAttributes);
    const data = struct.valueOf();
    if ((data.farm_token_id as Buffer).toString() !== asset.tokenId) return zero;

    return bn((data.farming_token_amount as BigNumberExt).toString(16), 16);
  }

  const codec = new BinaryCodec();
  const typeWrappedFarmTokenAttributes = new StructType("WrappedFarmTokenAttributes", [
    new StructFieldDefinition("farm_token_id", "", new TokenIdentifierType()),
    new StructFieldDefinition("farm_token_nonce", "", new U64Type()),
    new StructFieldDefinition("farm_token_amount", "", new BigUIntType()),
    new StructFieldDefinition("farming_token_id", "", new TokenIdentifierType()),
    new StructFieldDefinition("farming_token_nonce", "", new U64Type()),
    new StructFieldDefinition("farming_token_amount", "", new BigUIntType()),
  ]);
  const typeFarmTokenAttributes = new StructType("FarmTokenAttributes", [
    new StructFieldDefinition("reward_per_share", "", new BigUIntType()),
    new StructFieldDefinition("original_entering_epoch", "", new U64Type()),
    new StructFieldDefinition("entering_epoch", "", new U64Type()),
    new StructFieldDefinition("apr_multiplier", "", new U8Type()),
    new StructFieldDefinition("with_locked_rewards", "", new BooleanType()),
    new StructFieldDefinition("initial_farming_amount", "", new BigUIntType()),
    new StructFieldDefinition("compounded_reward", "", new BigUIntType()),
    new StructFieldDefinition("current_farm_amount", "", new BigUIntType()),
  ]);
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
// const RIDE_EGLD_POOL = "erd1qqqqqqqqqqqqqpgqav09xenkuqsdyeyy5evqyhuusvu4gl3t2jpss57g8x";
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
// farms v2:
// EGLD/MEX => MEX : erd1qqqqqqqqqqqqqpgqnqvjnn4haygsw2hls2k9zjjadnjf9w7g2jpsmc60a4
// EGLD/MEX => LKMEX: erd1qqqqqqqqqqqqqpgqyawg3d9r4l27zue7e9sz7djf7p9aj3sz2jpsm070jf
// EGLD/USDC => MEX: erd1qqqqqqqqqqqqqpgqutddd7dva0x4xmehyljp7wh7ecynag0u2jpskxx6xt
// EGLD/USDC => LKMEX: erd1qqqqqqqqqqqqqpgqwtzqckt793q8ggufxxlsv3za336674qq2jpszzgqra
// MEX => MEX: erd1qqqqqqqqqqqqqpgqe9v45fnpkv053fj0tk7wvnkred9pms892jps9lkqrn
// MEX => LKMEX: erd1qqqqqqqqqqqqqpgq7qhsw8kffad85jtt79t9ym0a4ycvan9a2jps0zkpen
