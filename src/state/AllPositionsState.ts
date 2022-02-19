import _ from "lodash";
import { createHook, createSelector, createStore, StoreActionApi } from "react-sweet-state";
import { Position, PositionArgs } from "../positions/base/Position";
import { PositionFactory } from "../positions/base/PositionFactory";
import { registerAllPositions } from "../positions";
import { to3, zero } from "@defi.org/web3-candies";
import { currentNetwork } from "../positions/base/consts";
import BN from "bn.js";

registerAllPositions();

const STORAGE_KEY = "PositionArgs:v1";
export const loadPositionsFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, PositionArgs>;
export const savePositionsToStorage = (data: Record<string, PositionArgs>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const AllPositionsState = createStore({
  name: "AllPositionsState",

  initialState: {
    positions: {} as Record<string, Position>,
    ready: false,
  },

  actions: {
    load: () => async (api) => {
      await load(api);
    },

    addPosition: (type: string, address: string, input: string, name: string) => async (api) => {
      const position = PositionFactory.create({ type, address, input, name, id: "" });
      if (!position) {
        alert(`unknown type ${type} at ${address}`);
        return;
      }

      const data = _.mapValues(api.getState().positions, (p) => p.getArgs());
      data[position.getArgs().id] = position.getArgs();
      savePositionsToStorage(data);
      await load(api);
    },

    update: (position: Position, newArgs: PositionArgs) => async (api) => {
      const data = _.mapValues(api.getState().positions, (p) => p.getArgs());
      data[position.getArgs().id] = newArgs;
      savePositionsToStorage(data);
      await load(api);
    },

    delete: (posId: string) => async (api) => {
      const data = _.mapValues(api.getState().positions, (p) => p.getArgs());
      delete data[posId];
      savePositionsToStorage(data);
      await load(api);
    },

    sendTransaction:
      (posId: string, useLegacyTx: boolean, method: string, args: string[]) =>
      async ({ getState }) => {
        await getState().positions[posId].sendTransaction(method, args, useLegacyTx);
      },

    harvest:
      (posId: string, useLegacyTx: boolean) =>
      async ({ getState }) => {
        await getState().positions[posId].harvest(useLegacyTx);
      },
  },
});

async function load(api: StoreActionApi<typeof AllPositionsState.initialState>) {
  console.log("LOAD positions");
  const current = api.getState().positions;
  const positions = _.mapValues(loadPositionsFromStorage(), (args) => current[args.id] || PositionFactory.create(args));

  for (const id in positions) if (!positions[id]) delete positions[id];

  if (!api.getState().ready) await PositionFactory.oracle.warmup(_.values(positions));

  const network = await currentNetwork();

  await Promise.all(
    _.map(positions, (p) => {
      if (!p || !network || !PositionFactory.shouldLoad(p, network)) return;
      return p.load().catch((e) => console.log(p.getArgs().type, e));
    })
  );
  api.setState({ positions, ready: true });
}

export const useAllPositionsActions = createHook(AllPositionsState, { selector: null });

export const useAllPositionRows = createHook(AllPositionsState, {
  selector: createSelector(
    (state) =>
      _(state.positions)
        .values()
        .sortBy((p) => p.getArgs().type)
        .value(),
    (positions) =>
      _.map(positions, (p) => ({
        id: p.getArgs().id,
        type: p.getArgs().type,
        name: p.getArgs().name || p.getName() || p.getArgs().type,
        chain: p.getNetwork().name,
        health: p.getHealth(),
        value: num(marketValue(p)),
        pending: num(p.getPendingRewards().reduce((sum, v) => sum.add(v.value), zero)),
        tvl: num(p.getTVL()),
        position: p,
        address: p.getArgs().address,
      }))
  ),
});
export const useAllPositions = createHook(AllPositionsState, {
  selector: (state) => state.positions,
});
export const useAllPositionsReady = createHook(AllPositionsState, {
  selector: (state) => state.ready,
});

export const useAllPositionsTotals = createHook(AllPositionsState, {
  selector: createSelector(
    (state) => _.groupBy(state.positions, (p) => p.getNetwork().name),
    (grouped) => {
      const totalPerChain = _(grouped)
        .map((positions, chain) => ({
          chain,
          value: Math.round(num(totalMarketValue(positions))),
        }))
        .sortBy((t) => -t.value)
        .value();
      return {
        labels: _.map(totalPerChain, (t) => t.chain),
        values: _.map(totalPerChain, (t) => t.value),
        grandtotal: _.reduce(totalPerChain, (sum, t) => sum + t.value, 0),
      };
    }
  ),
});

function num(bn: BN) {
  return to3(bn, 18).toNumber() / 1000;
}

function marketValue(p: Position) {
  return _.reduce(p.getAmounts(), (sum, v) => sum.add(v.value), zero);
}

function totalMarketValue(positions: Position[]) {
  return _.reduce(positions, (sum, pos) => sum.add(marketValue(pos)), zero);
}
