import { ElrondMaiar } from "../ElrondMaiar";
import { TokenAmount } from "./Position";
import { bn, erc20, erc20abi, Network, sleep, throttle, web3, zero } from "@defi.org/web3-candies";
import { ContractCallContext, Multicall } from "ethereum-multicall";
import { PriceOracle } from "./PriceOracle";
import _ from "lodash";
import BN from "bn.js";
import Web3 from "web3";
import { erc20s, networks } from "../consts";

const nativeAssets = {
  eth: () => erc20("ETH", erc20s.eth.WETH().address),
  bsc: () => erc20("BNB", erc20s.bsc.WBNB().address),
  poly: () => erc20("MATIC", erc20s.poly.WMATIC().address),
  arb: () => erc20("AETH", erc20s.arb.WETH().address),
  avax: () => erc20("AVAX", erc20s.avax.WAVAX().address),
};

export async function fetchBalances(oracle: PriceOracle, network: Network, wallet: string): Promise<Record<string, TokenAmount[]>> {
  if (network.id === ElrondMaiar.network.id || wallet.startsWith("erd1")) {
    return { Elrond: await ElrondMaiar.balances(oracle, wallet) };
  }

  let result: TokenAmount[] = [];

  if (network.id === networks.eth.id) {
    result = await fetchBalancesETH(oracle, wallet);
  }

  const balance = await web3().eth.getBalance(wallet);
  const asset = (nativeAssets as any)[network.shortname]();
  const amount = bn(balance);
  const value = await oracle.valueOf(network.id, asset, amount);
  result.push({ asset, amount, value });

  return { [network.name]: result };
}

async function fetchBalancesETH(oracle: PriceOracle, wallet: string) {
  const tokens = await getAllETHTokenInfos();
  await fetchMulticallBalances(wallet, tokens);
  const withbalance = _.filter(tokens, (t) => !!t.balance && !bn(t.balance).isZero());
  _.forEach(withbalance, (t) => (t.address = Web3.utils.toChecksumAddress(t.address)));

  await oracle.fetchPrices(
    networks.eth.id,
    _.map(withbalance, (t) => t.address)
  );

  return await Promise.all(
    _.map(withbalance, (t) => {
      const asset = erc20(t.name, t.address);
      return asset.mantissa(t.balance || zero).then((amount) =>
        oracle.valueOf(networks.eth.id, asset, amount).then((value) => ({
          asset,
          amount,
          value,
        }))
      );
    })
  );
}

type TokenInfo = { chainId: number; address: string; decimals: number; logoURI: string; name: string; symbol: string; balance?: BN };

const getAllETHTokenInfos = throttle(this, 60 * 60 * 24, async () => {
  const json = await fetch(`https://tokens.coingecko.com/uniswap/all.json`).then((it) => it.json());
  const result = _(json.tokens as TokenInfo[])
    .filter((t) => t.decimals >= 0 && t.decimals <= 18)
    .uniqBy((t) => t.address)
    .reject((t) => _.includes(blacklist, t.address))
    .value();

  delete json.tokens;
  console.log("fetched info for", result.length, "tokens on ETH");
  return result;
});

async function fetchMulticallBalances(wallet: string, tokens: TokenInfo[]) {
  if (!tokens.length) return;

  console.log("fetching balance for", tokens.length);

  let remaining = _.chunk(tokens, 400);
  for (let retries = 0; remaining.length && retries < 10; retries++) {
    remaining = await Promise.all(_.map(remaining, (tokens) => performMulticallBalanceOf(wallet, tokens)));
    const flattened = _.flatten(remaining);
    if (flattened.length && flattened.length < 10) console.log("warning:", flattened);
    remaining = _(flattened)
      .shuffle()
      .chunk(flattened.length / 10)
      .value();
    await sleep(0.5);
  }
  console.log("finally remaining", _(remaining).flatten().size());
}

async function performMulticallBalanceOf(wallet: string, tokens: TokenInfo[]) {
  if (!tokens.length) return [];
  try {
    const multicall = new Multicall({ web3Instance: web3(), tryAggregate: true });
    const calls = _.map(
      tokens,
      (t) =>
        ({
          reference: t.address,
          contractAddress: t.address,
          abi: erc20abi,
          calls: [{ reference: t.address, methodName: "balanceOf", methodParameters: [wallet] }],
        } as ContractCallContext)
    );
    const result = await multicall.call(calls);
    _.forEach(result.results, (v) => {
      const t = _.find(tokens, (t) => t.address === v.callsReturnContext[0].reference)!;
      t.balance = bn(v.callsReturnContext[0].returnValues[0].hex || "", 16);
    });
    result.results = {};
    return [];
  } catch (e) {
    return tokens;
  }
}

const blacklist = [
  "0x2859021eE7F2Cb10162E67F33Af2D22764B31aFf",
  "0x5e3845A1d78DB544613EdbE43Dc1Ea497266d3b8",
  "0x47140a767a861f7a1f3b0dd22a2f463421c28814",
  "0x1c5b760f133220855340003b43cc9113ec494823",
  "0x2859021ee7f2cb10162e67f33af2d22764b31aff",
  "0x5e3845a1d78db544613edbe43dc1ea497266d3b8",
];
