import _ from "lodash";
import { createHook, createSelector, createStore, StoreActionApi } from "react-sweet-state";
import { Position, PositionArgs, Threat, TokenAmount } from "../positions/base/Position";
import { PositionFactory } from "../positions/base/PositionFactory";
import { registerAllPositions } from "../positions";
import { fmt18, zero } from "@defi.org/web3-candies";

registerAllPositions();

const STORAGE_KEY = "PositionArgs:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, PositionArgs>;
const saveToStorage = (data: Record<string, PositionArgs>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const AllPositionsState = createStore({
  name: "AllPositionsState",

  initialState: {
    positions: {} as Record<string, Position>,
  },

  actions: {
    load:
      () =>
      async ({ dispatch }) => {
        await dispatch(load);
      },

    addPosition:
      (type: string, address: string) =>
      async ({ getState, dispatch }) => {
        const position = PositionFactory.create({ type, address, id: "" });
        if (!position) {
          alert(`unknown type ${type} at ${address}`);
          return;
        }

        const data = _.mapValues(getState().positions, (p) => p.getArgs());
        data[position.getArgs().id] = position.getArgs();
        saveToStorage(data);
        await dispatch(load);
      },

    delete:
      (posId: string) =>
      async ({ getState, dispatch }) => {
        const data = _.mapValues(getState().positions, (p) => p.getArgs());
        delete data[posId];
        saveToStorage(data);
        await dispatch(load);
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

async function load({ getState, setState }: StoreActionApi<typeof AllPositionsState.initialState>) {
  console.log("LOAD");
  const current = getState().positions;
  const positions = _.mapValues(loadFromStorage(), (args) => current[args.id] || PositionFactory.create(args));
  await Promise.all(_.map(positions, (p) => p.load().catch((e) => console.log(p.getArgs().type, e))));
  setState({ positions });
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
        health: fmtHealth(p.getHealth()),
        value: "$" + fmt18(p.getAmounts().reduce((sum, v) => sum.add(v.value), zero)).split(".")[0],
        pending: "$" + fmt18(p.getPendingRewards().reduce((sum, v) => sum.add(v.value), zero)).split(".")[0],
        tvl: "$" + fmt18(p.getTVL()).split(".")[0],
        position: p,
      }))
  ),
});
export const useAllPositions = createHook(AllPositionsState, {
  selector: (state) => state.positions,
});

function fmtAmounts(amnt: TokenAmount[]) {
  return _(amnt)
    .map((a) => `${a.asset.name}: ${fmt18(a.amount).split(".")[0]} ($${fmt18(a.value).split(".")[0]})`)
    .join(" + ");
}

function fmtHealth(health: Threat[]) {
  if (!health.length) return "🟢";
  return health.map((t) => t.message).join("⚠️");
}
