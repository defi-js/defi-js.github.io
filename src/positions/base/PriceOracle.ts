import _ from "lodash";
import BN from "bn.js";
import { bn18, ether, Token, web3, zero } from "@defi.org/web3-candies";
import { Position } from "./Position";
import { ElrondMaiar } from "../ElrondMaiar";
import { networks } from "./consts";
import { OffChain } from "../OffChain";

const coingeckoIds = {
  [networks.eth.id]: "ethereum",
  [networks.bsc.id]: "binance-smart-chain",
  [networks.poly.id]: "polygon-pos",
  [networks.arb.id]: "arbitrum-one",
  [networks.avax.id]: "avalanche",
};

export class PriceOracle {
  prices: Record<string, BN> = {
    USD: ether,
  };

  getId(networkId: number, token: Token) {
    if (networkId === networks.egld.id) return (token as ElrondMaiar.ESDT).tokenId;
    if (networkId === networks.off.id) return (token as OffChain.Asset).symbol;
    return token.address;
  }

  overridePrice(networkId: number, token: Token, price: BN) {
    this.prices[this.getId(networkId, token)] = price;
  }

  async valueOf(networkId: number, token: Token, amount: BN): Promise<BN> {
    const id = this.getId(networkId, token);

    if (!this.prices[id] || this.prices[id].isZero()) {
      if (networkId === networks.egld.id) await this.fetchPricesElrond([id]);
      else await this.fetchPrices(networkId, [id]);
    }

    if (!this.prices[id]) {
      console.log(`no price for ${token.name} ${token.address} for amount ${amount.toString()} on ${networkId}`);
      return zero;
    }

    return amount.mul(this.prices[id]).div(ether);
  }

  async warmup(positions: Position[]) {
    const bynetwork = _.groupBy(positions, (p) => p.getNetwork().id);
    console.log("warming up prices for", bynetwork);

    const coingeckoFetches = _(bynetwork)
      .keys()
      .filter((id) => parseInt(id) > 0)
      .map((id) =>
        this.fetchPrices(
          id,
          _(bynetwork[id])
            .map((p) => p.getAssets().concat(p.getRewardAssets()))
            .flatten()
            .map((a) => a.address)
            .uniq()
            .value()
        )
      )
      .value();

    const elrondFetch = this.fetchPricesElrond(
      _(bynetwork[networks.egld.id])
        .map((p) => p.getAssets().concat(p.getRewardAssets()))
        .flatten()
        .map((a) => (a as any).tokenId)
        .uniq()
        .value()
    );

    await Promise.all([...coingeckoFetches, elrondFetch]);
  }

  /**
   * returns price in USD 18 decimals by token address
   */
  async fetchPrices(networkId: number | string, addresses: string[]): Promise<{ [address: string]: BN }> {
    if (_.isEmpty(addresses)) return {};
    console.log("fetchPrices", addresses);

    try {
      const coingeckoId = _.find(coingeckoIds, (v, k) => k === networkId.toString())!;
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${coingeckoId}?contract_addresses=${addresses.join(",")}&vs_currencies=usd`;
      const response = await fetch(url);
      const json = (await response.json()) as Record<string, any>;

      const result = _(json)
        .mapKeys((v, k) => web3().utils.toChecksumAddress(k))
        .mapValues((v) => bn18(v.usd))
        .value();

      return this.updateResults(addresses, result);
    } catch (e) {
      return {};
    }
  }

  /**
   * returns price in USD 18 decimals by token ID
   */
  async fetchPricesElrond(tokenIds: string[]): Promise<{ [address: string]: BN }> {
    if (_.isEmpty(tokenIds)) return {};
    console.log("fetchPricesElrond", tokenIds);

    try {
      const body = {
        variables: _.mapKeys(tokenIds, (id, i) => `token${i}`),
        query: `query (${_.map(tokenIds, (id, i) => `$token${i}: String!`).join(", ")}) {
              ${_.map(tokenIds, (id, i) => `token${i}: getTokenPriceUSD(tokenID: $token${i})`).join("\n")}
            }`,
      };

      const response = await fetch("https://graph.maiar.exchange/graphql", {
        headers: {
          "content-type": "application/json",
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
    } catch (e) {
      return {};
    }
  }

  updateResults(inputs: any, results: { [p: string]: BN }) {
    if (_.isEmpty(results)) throw new Error(`no price for ${inputs}`);
    return _.merge(this.prices, results);
  }
}
