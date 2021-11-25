import _ from "lodash";
import { createHook, createSelector, createStore, StoreActionApi } from "react-sweet-state";
import { Position, PositionArgs, Threat, TokenAmount } from "../positions/base/Position";
import { PositionFactory } from "../positions/base/PositionFactory";
import { registerAllPositions } from "../positions";
import { fmt18 } from "@defi.org/web3-candies";

registerAllPositions();

const STORAGE_KEY = "PositionArgs:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, PositionArgs>;
const saveToStorage = (data: Record<string, PositionArgs>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const PositionsState = createStore({
  name: "PositionsState",

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
      (args: PositionArgs) =>
      async ({ getState, dispatch }) => {
        const position = PositionFactory.create(args);

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

    claim:
      (posId: string, useLegacyTx: boolean) =>
      async ({ getState }) => {
        await getState().positions[posId].claim(useLegacyTx);
      },

    sendCustomTx:
      (posId: string, useLegacyTx: boolean) =>
      async ({ getState }) => {
        await getState().positions[posId].sendCustomTx(useLegacyTx);
      },
  },
});

async function load({ getState, setState }: StoreActionApi<typeof PositionsState.initialState>) {
  try {
    console.log("LOAD");
    const current = getState().positions;
    const positions = _.mapValues(loadFromStorage(), (args) => current[args.id] || PositionFactory.create(args));
    await Promise.all(_.map(positions, (p) => p.load()));
    setState({ positions });
  } catch (e: any) {
    alert(e.message);
  }
}

export const usePositionActions = createHook(PositionsState, {
  selector: null,
});

export const useUpdatedPositionRows = createHook(PositionsState, {
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
        amounts: fmtAmounts(p.getAmounts()),
        pending: fmtAmounts(p.getPendingRewards()),
        health: fmtHealth(p.getHealth()),
      }))
  ),
});
export const useAddPosition = createHook(PositionsState, {
  selector: createSelector(
    () => null,
    (_, args: PositionArgs) => args,
    (state, args) => ({
      allTypes: PositionFactory.allTypes(),
      isValid: PositionFactory.isValidInput(args),
    })
  ),
});

function fmtAmounts(amnt: TokenAmount[]) {
  return _(amnt)
    .map((a) => `${a.asset.name}: ${fmt18(a.amount).split(".")[0]} = $${fmt18(a.value).split(".")[0]}`)
    .join(" + ");
}

function fmtHealth(health: Threat[]) {
  if (!health.length) return "🟢";
  return health.map((t) => t.message).join("⚠️");
}
