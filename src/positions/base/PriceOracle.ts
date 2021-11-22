import _ from "lodash";
import BN from "bn.js";
import Web3 from "web3";
import { bn18, ether, getNetwork, Token } from "@defi.org/web3-candies";

const coingeckoIds = {
  eth: "ethereum",
  bsc: "binance-smart-chain",
  poly: "polygon-pos",
};

export class PriceOracle {
  prices: Record<string, BN> = {};

  async valueOf(token: Token, amount: BN): Promise<BN> {
    const id = (token as any).tokenId || token.address;
    if (!this.prices[id]) {
      if ((token as any).esdt) await this.fetchPricesElrond(id);
      else await this.fetchPrices(id);
    }

    return amount.mul(this.prices[id]).div(ether);
  }

  /**
   * returns price in USD 18 decimals by token address
   */
  async fetchPrices(...addresses: string[]): Promise<{ [address: string]: BN }> {
    const network = await getNetwork();
    const coingeckoId = _.find(coingeckoIds, (v, k) => k == network.shortname)!;
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/${coingeckoId}?contract_addresses=${addresses.join(",")}&vs_currencies=usd`);
    const json = (await response.json()) as Record<string, any>;

    const result = _(json)
      .mapKeys((v, k) => Web3.utils.toChecksumAddress(k))
      .mapValues((v) => bn18(v.usd))
      .value();

    return this.updateResults(addresses, result);
  }

  /**
   * returns price in USD 18 decimals by token ID
   */
  async fetchPricesElrond(...tokenIds: string[]): Promise<{ [address: string]: BN }> {
    const body = {
      variables: _.mapKeys(tokenIds, (id, i) => `token${i}`),
      query: `query (${_.map(tokenIds, (id, i) => `$token${i}: String!`).join(", ")}) {
              ${_.map(tokenIds, (id, i) => `token${i}: getTokenPriceUSD(tokenID: $token${i})`).join("\n")}
            }`,
    };
    const response = await fetch("https://graph.maiar.exchange/graphql", {
      headers: {
        accept: "*/*",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
      },
      body: JSON.stringify(body),
      method: "POST",
    });
    const json = await response.json();

    const result = _(json.data)
      .mapKeys((v, k) => body.variables[k])
      .mapValues((v) => bn18(v))
      .value();

    return this.updateResults(tokenIds, result);
  }

  updateResults(inputs: any, results: { [p: string]: BN }) {
    if (_.isEmpty(results)) throw new Error(`no price for ${inputs}`);
    return _.merge(this.prices, results);
  }
}
