import _ from "lodash";
import { Position, PositionArgs } from "./Position";
import { PriceOracle } from "./PriceOracle";
import { Network, web3 } from "@defi.org/web3-candies";

type Factory = (args: PositionArgs, oracle: PriceOracle) => Position;

const registry = {} as Record<string, Factory>;

export namespace PositionFactory {
  export const oracle = new PriceOracle();

  export function register(types: Record<string, Factory>) {
    _.merge(registry, types);
  }

  export function allTypes() {
    return _.keys(registry);
  }

  export function create(args: PositionArgs): Position | null {
    if (!registry[args.type]) return null;

    if (!args.id) args.id = _.uniqueId(args.type + ":" + args.address + "-" + args.name + "-");

    return registry[args.type](args, oracle);
  }

  export function shouldLoad(p: Position, current: Network) {
    return p.getNetwork().id === current.id || p.getNetwork().id < 0; // non-web3 network
  }

  export function isValidWallet(address: string) {
    return web3()?.utils?.isAddress(address) || isElrondAddress("egld:", address);
  }

  export function isValidArgs(type: string, address: string) {
    return !!type && (web3()?.utils?.isAddress(address) || isElrondAddress(type, address) || isOffChainSymbol(type, address));
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
}
