import _ from "lodash";
import { PositionV1, PositionArgs, Network } from "./PositionV1";
import { PriceOracle } from "./PriceOracle";
import { web3 } from "@defi.org/web3-candies";

type Factory = (args: PositionArgs, oracle: PriceOracle) => PositionV1;

const registry = {} as Record<string, Factory>;

export namespace PositionFactory {
  export const oracle = new PriceOracle();

  export function register(types: Record<string, Factory>) {
    _.merge(registry, types);
  }

  export function allTypes() {
    return _.keys(registry);
  }

  export function create(args: PositionArgs): PositionV1 | null {
    if (!registry[args.type]) return null;

    if (!args.id) args.id = _.uniqueId(args.type + ":" + args.address + "-" + args.name + "-");

    return registry[args.type](args, oracle);
  }

  export function shouldLoad(p: PositionV1, current: Network) {
    return p.getNetwork().id === current.id || p.getNetwork().id < 0; // non-web3 network
  }

  export function isValidArgs(type: string, address: string) {
    return (
      (!!type && (web3()?.utils?.isAddress(address) || isElrondAddress(type, address) || isOffChainSymbol(type, address))) ||
      isBitcoinAddress(type, address) ||
      isSolanaAddress(type, address)
    );
  }

  function isElrondAddress(type: string, address: string) {
    try {
      return type.startsWith("egld:") && address.startsWith("erd1");
    } catch (e) {
      return false;
    }
  }

  function isOffChainSymbol(type: string, address: string) {
    try {
      return type.startsWith("x:OffChain:Asset") && _.trim(address).length > 0;
    } catch (e) {
      return false;
    }
  }

  function isBitcoinAddress(type: string, address: string) {
    try {
      return type.startsWith("x:Bitcoin") && _.trim(address).length > 0 && address.startsWith("bc1");
    } catch (e) {
      return false;
    }
  }

  function isSolanaAddress(type: string, address: string) {
    try {
      return type.startsWith("sol:") && _.trim(address).length === 44;
    } catch (e) {
      return false;
    }
  }
}
