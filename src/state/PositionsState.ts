import _ from "lodash";
import { createHook, createSelector, createStore } from "react-sweet-state";
import { Position, PositionArgs } from "../positions/base/Position";
import { PositionFactory } from "../positions/base/PositionFactory";
import { registerAllPositions } from "../positions";

registerAllPositions();

const STORAGE_KEY = "PositionArgs:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, PositionArgs>;
const saveToStorage = (data: Record<string, PositionArgs>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const PositionsState = createStore({
  name: "PositionsState",

  initialState: {} as { [id: string]: Position },

  actions: {
    load:
      () =>
      async ({ getState, setState }) => {
        await load(getState, setState);
      },

    addPosition:
      (args: PositionArgs) =>
      async ({ getState, setState }) => {
        const position = PositionFactory.create(args);

        const data = _.mapValues(getState(), (p) => p.getArgs());
        data[position.getArgs().id] = position.getArgs();
        saveToStorage(data);

        await load(getState, setState);
      },

    claim:
      (posId: string, useLegacyTx: boolean) =>
      async ({ getState }) => {
        await getState()[posId].claim(useLegacyTx);
      },

    delete:
      (posId: string) =>
      async ({ getState, setState }) => {
        const positions = _.mapValues(getState(), (p) => p.getArgs());
        delete positions[posId];
        saveToStorage(positions);

        await load(getState, setState);
      },
  },
});

async function load(getState: any, setState: any) {
  console.log("LOAD");
  const fromStorage = _.mapValues(loadFromStorage(), (args) => PositionFactory.create(args));
  getState().positions;
  await Promise.all(_.map(fromStorage, (p) => p.load()));
  setState({ positions: fromStorage });
}

export const useMyPositions = createHook(PositionsState, {
  selector: (state) =>
    _(state.positions)
      .values()
      .sortBy((p) => p.getArgs().type)
      .value(),
});
export const useAddPosition = createHook(PositionsState, {
  selector: createSelector(
    (_) => null,
    (_, args: PositionArgs) => args,
    (state, args) => ({
      allTypes: PositionFactory.allTypes(),
      isValid: PositionFactory.isValidInput(args),
    })
  ),
});
