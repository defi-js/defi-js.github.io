import _ from "lodash";
import { createHook, createSelector, createStore } from "react-sweet-state";
import { Position, PositionArgs, Threat, TokenAmount } from "../positions/base/Position";
import { PositionFactory } from "../positions/base/PositionFactory";
import { fmt18, getNetwork } from "@defi.org/web3-candies";
import { registerAllPositions } from "../positions";

registerAllPositions();

export type PositionResolved = { id: string; type: string; amounts: string; pending: string; health: string };

const PositionsState = createStore({
  name: "PositionsState",

  initialState: {
    positions: {} as Record<string, Position>,
    positions_resolved: {} as Record<string, PositionResolved>,
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
        localStorage.setItem("positions", JSON.stringify(data));

        await dispatch(load);
      },

    claim:
      (posId: string, useLegacyTx: boolean) =>
      async ({ getState }) => {
        await getState().positions[posId].claim(useLegacyTx);
      },

    delete:
      (posId: string) =>
      async ({ getState, dispatch }) => {
        const positions = _.mapValues(getState().positions, (p) => p.getArgs());
        delete positions[posId];
        localStorage.setItem("positions", JSON.stringify(positions));

        const positions_resolved = JSON.parse(localStorage.getItem("positions_resolved") || "{}") as Record<string, PositionResolved>;
        delete positions_resolved[posId];
        localStorage.setItem("positions_resolved", JSON.stringify(positions_resolved));

        await dispatch(load);
      },
  },
});

async function load(api: any) {
  console.log("LOAD");
  const { setState } = api;
  const data = JSON.parse(localStorage.getItem("positions") || "{}") as Record<string, PositionArgs>;
  const positions = _.mapValues(data, (args) => PositionFactory.create(args));
  setState({ positions });

  const positions_resolved = JSON.parse(localStorage.getItem("positions_resolved") || "{}") as Record<string, PositionResolved>;
  const resolvedCurrent = await resolveForCurrentNetwork(positions);

  _.merge(
    positions_resolved,
    _.mapKeys(resolvedCurrent, (p) => p.id)
  );

  localStorage.setItem("positions_resolved", JSON.stringify(positions_resolved));

  setState({ positions_resolved });
}

async function resolveForCurrentNetwork(positions: Record<string, Position>) {
  const currentNetwork = await getNetwork();
  return await Promise.all(
    _(positions)
      .values()
      .filter((p) => PositionFactory.shouldLoad(p, currentNetwork))
      .map(async (position) => ({
        id: position.getArgs().id,
        type: position.getArgs().type,
        amounts: fmt(await position.getAmounts()),
        pending: fmt(await position.getPendingRewards()),
        health: fmtHealth(await position.getHealth()),
      }))
      .value()
  );
}

export const useMyPositions = createHook(PositionsState, { selector: (state) => _.values(state.positions_resolved) });
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

function fmt(amnt: TokenAmount[]) {
  return _(amnt)
    .map((a) => `${a.asset.name}: ${fmt18(a.amount).split(".")[0]} = $${fmt18(a.value).split(".")[0]}`)
    .join(" + ");
}

function fmtHealth(health: Threat[]) {
  if (!health.length) return "🟢";
  return health.map((t) => t.message).join("⚠️");
}
