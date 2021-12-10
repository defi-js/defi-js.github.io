import { fmt18, getNetwork, Network, networks, Token } from "@defi.org/web3-candies";
import { erc20s } from "../consts";
import _ from "lodash";

// const moralisChainId = {
//   [networks.eth.id]: "eth",
//   [networks.bsc.id]: "bsc",
//   [networks.poly.id]: "polygon",
//   // [networks.poly.id]: "avalanche",
// };

export async function fetchBalances(wallet: string, network: Network) {
  if (network.id <= 0) return;
  if ((await getNetwork()).id != network.id) return;

  // const balances = await fetch(`https://deep-index.moralis.io/api/v2/${wallet}/erc20?chain=${moralisChainId[network.id]}`);
  // console.log(balances);

  // const networkTokens = _.get(erc20s, [network.shortname]);
  // const tokens = _(networkTokens)
  //   .keys()
  //   .map((k) => networkTokens[k]() as Token)
  //   .value();
  //
  // const balances = await Promise.all(
  //   _.map(tokens, (t) =>
  //     t.methods
  //       .balanceOf(wallet)
  //       .call()
  //       .then((b) => t.mantissa(b).then((amount) => ({ asset: t, amount })))
  //   )
  // );
  // console.log(balances.map((b) => b.asset.name + ":" + fmt18(b.amount)));

  return {};
}
