import _ from "lodash";
import { bn, erc20, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { PositionFactory } from "./base/PositionFactory";
import { networks } from "./base/consts";

export namespace ElrondMaiar {
  export type ESDT = Token & { esdt: true; tokenId: string; dec: number };

  const tokens = {
    EGLD: () => esdt("WEGLD", "WEGLD-bd4d79", 18),
    USDC: () => esdt("USDC", "USDC-c76f1f", 6),
    MEX: () => esdt("MEX", "MEX-455c57", 18),
    RIDE: () => esdt("RIDE", "RIDE-7d18e9", 18),
    LKMEX: () => esdt("LKMEX", "LKMEX-aab910", 18),

    MEX_EGLD: () => esdt("MEX/EGLD LP", "EGLDMEX-0be9e5", 18),
    USDC_EGLD: () => esdt("USDC/EGLD LP", "EGLDUSDC-594e5e", 18),

    LKFARM: () => esdt("LKFARM", "LKFARM-9d1ea8", 18),
  };

  export type Strategy = { assets: ESDT[]; pool: string; farm: string; lp: ESDT };

  export const FarmStrategies = {
    USDC_EGLD: () => ({
      assets: [tokens.USDC(), tokens.EGLD()],
      pool: "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq",
      farm: "erd1qqqqqqqqqqqqqpgqutddd7dva0x4xmehyljp7wh7ecynag0u2jpskxx6xt",
      lp: tokens.USDC_EGLD(),
    }),
    L_USDC_EGLD: () => ({
      assets: [tokens.USDC(), tokens.EGLD()],
      pool: "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq",
      farm: "erd1qqqqqqqqqqqqqpgqwtzqckt793q8ggufxxlsv3za336674qq2jpszzgqra",
      lp: tokens.USDC_EGLD(),
    }),
    MEX_EGLD: () => ({
      assets: [tokens.MEX(), tokens.EGLD()],
      pool: "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
      farm: "erd1qqqqqqqqqqqqqpgqnqvjnn4haygsw2hls2k9zjjadnjf9w7g2jpsmc60a4",
      lp: tokens.MEX_EGLD(),
    }),
    L_MEX_EGLD: () => ({
      assets: [tokens.MEX(), tokens.EGLD()],
      pool: "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
      farm: "erd1qqqqqqqqqqqqqpgqyawg3d9r4l27zue7e9sz7djf7p9aj3sz2jpsm070jf",
      lp: tokens.MEX_EGLD(),
    }),
  };

  class Farm implements Position {
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

    getNetwork = () => networks.egld;

    getAssets = () => this.strategy.assets;

    getRewardAssets = () => [this.mex];

    getData = () => this.data;

    getHealth = () => [];

    getAmounts = () =>
      this.getAssets().length > 1
        ? [
            {
              asset: this.getAssets()[0],
              amount: this.data.amount0,
              value: this.data.value0,
            },
            {
              asset: this.getAssets()[1],
              amount: this.data.amount1,
              value: this.data.value1,
            },
          ]
        : [
            {
              asset: this.getAssets()[0],
              amount: this.data.amount0,
              value: this.data.value0,
            },
          ];

    getPendingRewards = () => [{ asset: this.mex, amount: this.data.rewardAmount, value: this.data.rewardValue }];

    getTVL = () => this.data.tvl;

    async load() {
      const [asset0, asset1] = this.getAssets();
      const [farmEsdts, pairEsdts, totalLPSupply] = await Promise.all([getESDTs(this.strategy.farm), getESDTs(this.strategy.pool), getTotalSupply(this.strategy.lp)]);
      const totalLPStaked = bn(_.find(farmEsdts, (e) => e.tokenIdentifier === this.strategy.lp.tokenId)!.balance);
      const asset0InPair = bn(_.find(pairEsdts, (t) => t.tokenIdentifier === asset0.tokenId)!.balance);
      const asset1InPair = bn(_.find(pairEsdts, (t) => t.tokenIdentifier === asset1.tokenId)!.balance);
      const asset0TotalValue = await this.oracle.valueOf(this.getNetwork().id, asset0, totalLPStaked.mul(asset0InPair).div(totalLPSupply));
      const asset1TotalValue = await this.oracle.valueOf(this.getNetwork().id, asset1, totalLPStaked.mul(asset1InPair).div(totalLPSupply));
      this.data.tvl = asset0TotalValue.add(asset1TotalValue);

      const esdts = await getESDTs(this.args.address);
      const lpNameSuffix = this.strategy.lp.tokenId.split("-")[0];
      const lps = _.find(esdts, (t) => t.tokenIdentifier.startsWith(lpNameSuffix));
      if (!lps) return;

      this.data.lpBalanceStaked = bn(lps!.balance);
      this.data.amount0 = this.data.lpBalanceStaked.mul(asset0InPair).div(totalLPSupply);
      this.data.amount1 = this.data.lpBalanceStaked.mul(asset1InPair).div(totalLPSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, asset1, this.data.amount1);
    }

    getContractMethods = () => [];

    async callContract(method: string, args: string[]) {}

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}

    async harvest(useLegacyTx: boolean) {}
  }

  export const MexFarmStrategies = {
    MEX: () => ({
      assets: [tokens.MEX()],
      pool: "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl",
      farm: "erd1qqqqqqqqqqqqqpgqe9v45fnpkv053fj0tk7wvnkred9pms892jps9lkqrn",
      lp: tokens.MEX(),
    }),
    L_MEX: () => ({
      assets: [tokens.MEX()],
      pool: "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl",
      farm: "erd1qqqqqqqqqqqqqpgq7qhsw8kffad85jtt79t9ym0a4ycvan9a2jps0zkpen",
      lp: tokens.LKMEX(),
    }),
  };

  class MexFarm extends Farm {
    getRewardAssets = () => [(this.strategy as Strategy).lp];

    getPendingRewards = () => [{ asset: this.mex, amount: this.data.rewardAmount, value: this.data.rewardValue }];

    override async load() {
      const asset = this.getAssets()[0];

      const farmEsdts = await getESDTs(this.strategy.farm);
      const totalAssetStaked = bn(_.find(farmEsdts, (e) => e.tokenIdentifier === asset.tokenId)!.balance);
      this.data.tvl = await this.oracle.valueOf(networks.egld.id, asset, totalAssetStaked);

      const esdts = await getESDTs(this.args.address);
      const farmNftWrapper = _.find(esdts, (e) => e.creator === this.strategy.pool.toString() && e.tokenIdentifier.startsWith(tokens.LKFARM().tokenId));
      if (!farmNftWrapper) return;

      this.data.amount0 = bn(farmNftWrapper.balance.toString());
      this.data.value0 = await this.oracle.valueOf(networks.egld.id, asset, this.data.amount0);
    }
  }

  function esdt(name: string, tokenId: string, decimals: number): ESDT {
    const result = erc20(name, zeroAddress) as ESDT;
    result.esdt = true;
    result.tokenId = tokenId;
    result.dec = decimals;
    return result;
  }

  async function getESDTs(address: string) {
    const response = await fetch(`https://gateway.elrond.com/address/${address}/esdt`);
    const json = await response.json();
    return _.get(json, ["data", "esdts"], []);
  }

  async function getTotalSupply(token: ESDT) {
    const response = await fetch(`https://gateway.elrond.com/network/esdt/supply/${token.tokenId}`);
    const json = await response.json();
    return bn(_.get(json, ["data", "supply"], "0"));
  }

  export function register() {
    PositionFactory.register({
      "egld:Maiar:Farm:USDC/EGLD": (args, oracle) => new Farm(args, oracle, ElrondMaiar.FarmStrategies.USDC_EGLD()),
      "egld:Maiar:LFarm:USDC/EGLD": (args, oracle) => new Farm(args, oracle, ElrondMaiar.FarmStrategies.L_USDC_EGLD()),
      "egld:Maiar:Farm:MEX/EGLD": (args, oracle) => new Farm(args, oracle, ElrondMaiar.FarmStrategies.MEX_EGLD()),
      "egld:Maiar:LFarm:MEX/EGLD": (args, oracle) => new Farm(args, oracle, ElrondMaiar.FarmStrategies.L_MEX_EGLD()),
      "egld:Maiar:MEXFarm:MEX": (args, oracle) => new MexFarm(args, oracle, ElrondMaiar.MexFarmStrategies.MEX()),
      "egld:Maiar:MEXLFarm:MEX": (args, oracle) => new MexFarm(args, oracle, ElrondMaiar.MexFarmStrategies.L_MEX()),
    });
  }

  // export async function balances(oracle: PriceOracle, address: string): Promise<TokenAmount[]> {
  //   const assets = _.map(tokens, (t) => t());

  // https://gateway.elrond.com/address/:bech32Address/balance

  // const [esdts, balanceEGLD] = await Promise.all([getESDTs(address), provider.getAccount(new Address(address)).then((r) => bn(r.balance.toString()))]);

  // const balances = await Promise.all(
  //   _(esdts)
  //     .map((e) => ({ asset: _.find(assets, (asset) => e.tokenIdentifier === asset.tokenId), esdt: e }))
  //     .filter((t) => !!t.asset)
  //     .map(async (t) => {
  //       const amount = to18(t.esdt.balance, t.asset!.dec);
  //       return {
  //         asset: t.asset!,
  //         amount,
  //         value: await oracle.valueOf(networks.egld.id, t.asset!, amount),
  //       };
  //     })
  //     .value()
  // );

  // balances.push({ asset: esdt("EGLD", "", 18), amount: balanceEGLD, value: await oracle.valueOf(networks.egld.id, tokens.EGLD(), balanceEGLD) });

  // return balances;
  // }
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
