import _ from "lodash";
import { createHook, createStore, StoreActionApi } from "react-sweet-state";
import { fetchBalances } from "../positions/base/Balances";
import { networks } from "@defi.org/web3-candies";
import { ElrondMaiar } from "../positions/ElrondMaiar";

const STORAGE_KEY = "Wallets:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
const saveToStorage = (data: string[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const WalletsState = createStore({
  name: "WalletsState",

  initialState: {
    wallets: [] as string[],
    eth: [],
    bsc: [],
    poly: [],
    egld: [],
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
  const [a] = await Promise.all([
    wallets.map((w) => fetchBalances(w, networks.eth)),
    wallets.map((w) => fetchBalances(w, networks.bsc)),
    wallets.map((w) => fetchBalances(w, networks.poly)),
    wallets.map((w) => fetchBalances(w, ElrondMaiar.network)),
  ]);
}

export const useWalletsRows = createHook(WalletsState, {
  selector: (state) => state.wallets,
});
