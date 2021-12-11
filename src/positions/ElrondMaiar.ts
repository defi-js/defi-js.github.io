import { Position, PositionArgs, TokenAmount } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, erc20, ether, to18, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import { Address, BigUIntValue, BytesValue, ContractFunction, ProxyProvider, SmartContract } from "@elrondnetwork/erdjs/out";
import _ from "lodash";
import BigNumberExt from "bignumber.js";
import BN from "bn.js";

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

  export async function balances(oracle: PriceOracle, address: string) {
    const usdc = tokens.USDC();
    const mex = tokens.MEX();
    const lkmex = tokens.LKMEX();
    const egld = tokens.EGLD();

    const [esdts, balanceEGLD] = await Promise.all([
      provider.getAddressEsdtList(new Address(address)),
      provider.getAccount(new Address(address)).then((r) => bn(r.balance.toString())),
    ]);
    const balanceUSDC = bn(_.find(esdts, (t) => t.tokenIdentifier === usdc.tokenId)?.balance);
    const balanceMEX = bn(_.find(esdts, (t) => t.tokenIdentifier === mex.tokenId)?.balance);
    const balanceLKMEX = bn(_.find(esdts, (t) => t.tokenIdentifier === lkmex.tokenId)?.balance);

    const [vEGLD, vUSDC, vMEX, vLKMEX] = await Promise.all([
      oracle.valueOf(egld, balanceEGLD),
      oracle.valueOf(usdc, balanceUSDC),
      oracle.valueOf(mex, balanceMEX),
      oracle.valueOf(mex, balanceLKMEX),
    ]);
    return [
      { asset: egld, amount: balanceEGLD, value: vEGLD },
      { asset: usdc, amount: balanceUSDC, value: vUSDC },
      { asset: mex, amount: balanceMEX, value: vMEX },
      { asset: lkmex, amount: balanceLKMEX, value: vLKMEX },
    ] as TokenAmount[];
  }

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
    mex = tokens.MEX();
    lkmex = tokens.LKMEX();

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

    getArgs = () => this.args;

    getNetwork = () => network;

    getAssets = () => this.strategy.assets;

    getRewardAssets = () => [this.lkmex];

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

      this.data.lpBalanceStaked = farmNfts.map((nft) => parseAmountLpFromAttributes(nft.attributes)).reduce((sum, b) => sum.add(b), zero);

      this.data.rewardAmount = await Promise.all(farmNfts.map((nft) => callAndParseGetPendingRewards(farm, nft.balance, nft.attributes))).then((r) =>
        r.reduce((sum, r) => sum.add(r), zero)
      );

      const percentOfPool = this.data.lpBalanceStaked.mul(ether).div(lpTotalSupply);
      const token0 = to18(this.strategy.assets[0].tokenId === token0Id[0] ? token0r : token1r, this.strategy.assets[0].dec);
      const token1 = to18(this.data.amount0 === token0r ? token1r : token0r, this.strategy.assets[1].dec);
      this.data.amount0 = percentOfPool.mul(token0).div(ether);
      this.data.amount1 = percentOfPool.mul(token1).div(ether);
      [this.data.value0, this.data.value1, this.data.tvl, this.data.rewardValue] = await Promise.all([
        this.oracle.valueOf(this.strategy.assets[0], this.data.amount0),
        this.oracle.valueOf(this.strategy.assets[1], this.data.amount1),
        this.oracle.valueOf(this.strategy.assets[1], token1.muln(2).mul(farmingTokenReserve).div(lpTotalSupply)),
        this.oracle.valueOf(this.mex, this.data.rewardAmount),
      ]);
    }

    getContractMethods = () => [];

    async callContract(method: string, args: string[]) {}

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

  function call(contract: SmartContract, fn: string) {
    return contract.runQuery(provider, { func: new ContractFunction(fn) }).then((r) => r.returnData);
  }

  //#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
  // pub struct FarmTokenAttributes<M: ManagedTypeApi> {
  //     pub reward_per_share: BigUint<M>,
  //     pub original_entering_epoch: u64,
  //     pub entering_epoch: u64,
  //     pub apr_multiplier: u8,
  //     pub with_locked_rewards: bool,
  //     pub initial_farming_amount: BigUint<M>,
  //     pub compounded_reward: Bigu32,
  //     pub current_farm_amount: BigUint<M>,
  // }
  //000000000000000008 08b17d48809d7fc0 00000000000001e9 00000000000001e9 0f 01 00000008 77a3ec302d1cd52c 00000000 00000009 07029ad6d2a4b07d94
  function parseAmountLpFromAttributes(attributes: string) {
    let hex = base64(attributes).toString("hex");
    if (hex.length % 2 !== 0) {
      hex = "0" + hex;
    }

    let bytes = [];
    for (let i = 0; i < hex.length - 1; i += 2) bytes.push(hex[i] + hex[i + 1]);

    const perShare_z = parseInt(bytes[0], 16);
    const origEpoch_z = 8;
    const enterEpoch_z = 8;
    const apr_z = 1;
    const locked_z = 1;
    const lp_z_z = 4;
    const lp_z_index = perShare_z + origEpoch_z + enterEpoch_z + apr_z + locked_z + lp_z_z;
    const lp_z = parseInt(bytes[lp_z_index], 16);
    const lp_index = lp_z_index + 1;
    return bn(_.slice(bytes, lp_index, lp_index + lp_z).join(""), 16);
  }

  async function callAndParseGetPendingRewards(farm: SmartContract, balanceFarmNFT: BN, attributes: string) {
    const result = await farm.runQuery(provider, {
      func: new ContractFunction("calculateRewardsForGivenPosition"),
      args: [new BigUIntValue(BigNumberExt.max(balanceFarmNFT.toString())), new BytesValue(Buffer.from(attributes, "base64"))],
    });
    result.assertSuccess();
    return base64(result.returnData[0]);
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
