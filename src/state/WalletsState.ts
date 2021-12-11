import _ from "lodash";
import { createHook, createStore, StoreActionApi } from "react-sweet-state";
import { fetchBalances } from "../positions/base/Balances";
import { TokenAmount } from "../positions/base/Position";
import { fmt18 } from "@defi.org/web3-candies";

const STORAGE_KEY = "Wallets:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
const saveToStorage = (data: string[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

type NetworkShortname = string;
type WalletBalances = Record<NetworkShortname, TokenAmount[]>;
type WalletRow = { id: string; wallet: string; network: string; asset: string; amount: string; value: string };

const WalletsState = createStore({
  name: "WalletsState",

  initialState: {
    wallets: [] as string[],
    balances: {} as Record<string, WalletBalances>,
    rows: [] as WalletRow[],
  },

  actions: {
    load:
      () =>
      async ({ dispatch }) => {
        await dispatch(load);
      },

    add:
      (address: string) =>
      async ({ getState, dispatch }) => {
        const current = getState().wallets;
        saveToStorage(_.uniq(_.concat(current, address)));
        await dispatch(load);
      },

    delete:
      (address: string) =>
      async ({ getState, setState, dispatch }) => {
        const current = getState().wallets;
        const wallets = _.filter(current, (a) => a !== address);
        saveToStorage(wallets);
        setState({ wallets });
        await dispatch(load);
      },
  },
});

async function load({ getState, setState }: StoreActionApi<typeof WalletsState.initialState>) {
  console.log("LOAD wallets");
  const wallets = _.merge(loadFromStorage(), getState().wallets);
  setState({ wallets });

  const fetched = await Promise.all(wallets.map((w) => fetchBalances(w)));
  const balances = {} as Record<string, Record<string, TokenAmount[]>>;
  setState({ balances });

  const rows = [] as WalletRow[];
  _.forEach(wallets, (w, i) => {
    balances[w] = fetched[i];
    _.forEach(balances[w], (aa, n) => {
      const nonzero = _.filter(aa, (a) => !a.amount.isZero());
      _.forEach(nonzero, (a) => {
        rows.push({
          id: `${w}:${n}:${a.asset.name}`,
          wallet: w,
          network: n,
          asset: a.asset.name,
          amount: fmt18(a.amount),
          value: "$" + fmt18(a.value).split(".")[0],
        });
      });
    });
  });

  setState({ rows });
}
export const useWalletsRows = createHook(WalletsState, { selector: (state) => state.wallets });
export const useWalletsBalancesRows = createHook(WalletsState, {
  selector: (state) => state.rows,
});
