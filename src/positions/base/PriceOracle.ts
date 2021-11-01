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

    if (_.isEmpty(result)) throw new Error(`no price for ${addresses}`);
    _.merge(this.prices, result);

    return result;
  }

  async valueOf(token: Token, amount: BN): Promise<BN> {
    if (!this.prices[token.address]) await this.fetchPrices(token.address);

    return amount.mul(this.prices[token.address]).div(ether);
  }
}
