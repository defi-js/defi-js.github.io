import _ from "lodash";
import { Position, PositionArgs } from "./Position";
import { PriceOracle } from "./PriceOracle";
import { Network } from "@defi.org/web3-candies";
import Web3 from "web3";
import { Address } from "@elrondnetwork/erdjs/out";

type Factory = (args: PositionArgs, oracle: PriceOracle) => Position;

const registry = {} as Record<string, Factory>;

export namespace PositionFactory {
  const oracle = new PriceOracle();

  export function register(types: Record<string, Factory>) {
    _.merge(registry, types);
  }

  export function allTypes() {
    return _.keys(registry);
  }

  export function create(args: PositionArgs): Position | null {
    if (!registry[args.type]) return null;

    if (!args.id) args.id = args.type + ":" + args.address;

    return registry[args.type](args, oracle);
  }

  export function shouldLoad(p: Position, current: Network) {
    return p.getNetwork().id === current.id || p.getNetwork().id < 0; // non-web3 network
  }

  export function isValidInput(type: string, address: string) {
    return !!type && (Web3.utils.isAddress(address) || isElrondAddress(type, address));
  }

  function isElrondAddress(type: string, address: string) {
    try {
      return type.startsWith("egld:") && address.startsWith("erd1") && !Address.fromString(address).isEmpty();
    } catch (e) {
      return false;
    }
  }
}
