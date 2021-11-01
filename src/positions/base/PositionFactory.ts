import _ from "lodash";
import { Position, PositionArgs } from "./Position";
import { PriceOracle } from "./PriceOracle";

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
}
