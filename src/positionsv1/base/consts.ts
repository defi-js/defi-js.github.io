import _ from "lodash";
import { account, bn, erc20abi, erc20s as erc20sOrig, networks as networksOrig, web3 } from "@defi.org/web3-candies";
import { ContractCallContext, Multicall } from "ethereum-multicall";

export const erc20s = _.merge({}, erc20sOrig, {});

export const networks = _.merge({}, networksOrig, {
  off: { id: -1, name: "OffChain", shortname: "off" },
  btc: { id: -2, name: "Bitcoin", shortname: "btc" },
  egld: { id: -508, name: "Elrond", shortname: "egld" },
});

export async function currentNetwork() {
  const netId = bn((window as any).ethereum.chainId, 16).toNumber();
  console.log("detected networkId", netId);
  return _.find(networks, (n) => n.id === netId);
}

export async function sendWithTxType(tx: any, useLegacyTx: boolean) {
  await tx.send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" });
}

export async function performMulticallBalanceOf(wallet: string, tokens: string[]) {
  if (!tokens.length) return [];
  try {
    const multicall = new Multicall({ web3Instance: web3(), tryAggregate: true });
    const calls = _.map(
      tokens,
      (t) =>
        ({
          reference: t,
          contractAddress: t,
          abi: erc20abi,
          calls: [{ reference: t, methodName: "balanceOf", methodParameters: [wallet] }],
        } as ContractCallContext)
    );
    const result = await multicall.call(calls);

    return _.map(result.results, (v) => {
      const t = _.find(tokens, (t) => t === v.callsReturnContext[0].reference)!;
      return { address: t, balance: bn(v.callsReturnContext[0].returnValues[0].hex || "", 16) };
    });
  } catch (e) {
    return tokens;
  }
}
