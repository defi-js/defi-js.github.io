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

  export function create(args: PositionArgs): Position {
    if (!registry[args.type]) throw new Error(`unknown type ${args.type} for ${JSON.stringify(args)}`);

    if (!args.id) args.id = _.uniqueId(args.type);

    return registry[args.type](args, oracle);
  }

  export function shouldLoad(p: Position, current: Network) {
    // TODO refactor into Position
    return p.getNetwork().id == current.id || p.getNetwork().id < 0; // non-web3 network
  }

  export function isValidInput(args: PositionArgs) {
    return Web3.utils.isAddress(args.address) || isElrondAddress(args);
  }

  function isElrondAddress(args: PositionArgs) {
    try {
      return args.type.startsWith("egld:") && args.address.startsWith("erd1") && !Address.fromString(args.address).isEmpty();
    } catch (e) {
      return false;
    }
  }
}
