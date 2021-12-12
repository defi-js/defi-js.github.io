import _ from "lodash";
import { createHook, createStore, StoreActionApi } from "react-sweet-state";
import { fetchBalances } from "../positions/base/Balances";
import { TokenAmount } from "../positions/base/Position";
import { ether, fmt18, getNetwork } from "@defi.org/web3-candies";
import { PositionFactory } from "../positions/base/PositionFactory";

const STORAGE_KEY = "Wallets:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
const saveToStorage = (data: string[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

type WalletBalances = Record<string, TokenAmount[]>;
type WalletRow = { id: string; wallet: string; network: string; asset: string; amount: string; value: string };

const WalletsState = createStore({
  name: "WalletsState",

  initialState: {
    wallets: [] as string[],
    balances: {} as Record<string, WalletBalances>,
    rows: [] as WalletRow[],
  },

  actions: {
    load: () => async (api) => {
      await load(api);
    },

    add: (address: string) => async (api) => {
      const current = api.getState().wallets;
      saveToStorage(_.uniq(_.concat(current, address)));
      await load(api);
    },

    delete: (address: string) => async (api) => {
      const current = api.getState().wallets;
      const wallets = _.filter(current, (a) => a !== address);
      saveToStorage(wallets);
      api.setState({ wallets });
      await load(api);
    },
  },
});

async function load({ getState, setState }: StoreActionApi<typeof WalletsState.initialState>) {
  console.log("LOAD wallets");
  const wallets = _.merge(loadFromStorage(), getState().wallets);
  setState({ wallets });

  const network = await getNetwork();
  const oracle = PositionFactory.oracle;
  const fetched = await Promise.all(wallets.map((w) => fetchBalances(oracle, network, w)));
  const balances = getState().balances;

  const rows = [] as WalletRow[];
  _.forEach(wallets, (w, i) => {
    balances[w] = _.merge({}, balances[w], fetched[i]);

    _.forEach(balances[w], (aa, n) => {
      const nonzero = _.filter(aa, (a) => a.value.gte(ether));
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
