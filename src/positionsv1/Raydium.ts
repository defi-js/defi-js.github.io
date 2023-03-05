import { PositionFactory } from "./base/PositionFactory";
import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { bn18, convertDecimals, erc20, Token, zero, zeroAddress } from "@defi.org/web3-candies";
import { PriceOracle } from "./base/PriceOracle";
import { networks } from "./base/consts";
import _ from "lodash";

export namespace Raydium {
  export function register() {
    PositionFactory.register({
      "sol:Raydium:Pool:ORBS/SOL": (args, oracle) => new Pool(args, oracle, "ORBS", "2iHXwoH2LaMyiLL2WKDNx732rQ7CsMScNRavB1bmT5aZ", "orbs"),
    });
  }

  export type SolToken = Token & { sol: true; coingeckoId: string };

  class Pool implements PositionV1 {
    sol = erc20("SOL", zeroAddress) as SolToken;
    token = erc20(this.tokenName, zeroAddress) as SolToken;

    data = {
      tokenName: this.tokenName,
      lpMintAddress: this.lpMintAddress,
      amountToken: zero,
      amountSol: zero,
      valueToken: zero,
      valueSol: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public tokenName: string, public lpMintAddress: string, coingeckoId: string) {
      this.sol.sol = true;
      this.sol.coingeckoId = "solana";
      this.token.sol = true;
      this.token.coingeckoId = coingeckoId;
    }

    getName = () => ``;
    getArgs = () => this.args;
    getNetwork = () => networks.sol;
    getData = () => this.data;
    getAssets = () => [this.token, this.sol];
    getRewardAssets = () => [];
    getPendingRewards = () => [];
    getHealth = () => [];
    getAmounts = () => [
      { asset: this.token, amount: this.data.amountToken, value: this.data.valueToken },
      { asset: this.sol, amount: this.data.amountSol, value: this.data.valueSol },
    ];
    getTVL = () => this.data.tvl;

    async load() {
      const lpAmount = await this.fetchLpAmount();
      const lpInfo = await this.fetchLpInfo();

      const totalLps = bn18(lpInfo.tokenAmountLp);
      const totalTokens = bn18(lpInfo.tokenAmountCoin);
      const totalSol = bn18(lpInfo.tokenAmountPc);

      this.data.amountToken = totalTokens.times(lpAmount).div(totalLps);
      this.data.amountSol = totalSol.times(lpAmount).div(totalLps);

      this.data.valueToken = await this.oracle.valueOf(networks.sol.id, this.token, this.data.amountToken);
      this.data.valueSol = await this.oracle.valueOf(networks.sol.id, this.sol, this.data.amountSol);

      const totalTokensValue = await this.oracle.valueOf(networks.sol.id, this.token, totalTokens);
      const totalSolValue = await this.oracle.valueOf(networks.sol.id, this.sol, totalSol);
      this.data.tvl = totalTokensValue.plus(totalSolValue);
    }

    getContractMethods = () => [];
    async callContract(method: string, args: string[]) {}
    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}
    async harvest(useLegacyTx: boolean) {}

    async fetchLpInfo() {
      const pairs = await fetch("https://api.raydium.io/v2/main/pairs").then((x) => x.json());
      return _.find(pairs, (p) => p.lpMint === this.lpMintAddress);
    }

    async fetchLpAmount() {
      const response = await fetch(`https://api.mainnet-beta.solana.com`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountsByOwner",
          params: [this.args.address, { mint: this.lpMintAddress }, { encoding: "jsonParsed" }],
        }),
      }).then((it) => it.json());
      const { amount, decimals } = response.result.value[0].account.data.parsed.info.tokenAmount;
      return convertDecimals(amount, decimals, 18);
    }
  }
}
