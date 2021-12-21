import _ from "lodash";
import { createHook, createSelector, createStore, StoreActionApi } from "react-sweet-state";
import { fetchBalances } from "../positions/base/Balances";
import { TokenAmount } from "../positions/base/Position";
import { to3 } from "@defi.org/web3-candies";
import { PositionFactory } from "../positions/base/PositionFactory";
import { currentNetwork } from "../positions/consts";

const STORAGE_KEY = "Wallets:v1";
const loadFromStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
const saveToStorage = (data: string[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

type WalletBalances = Record<string, TokenAmount[]>;

const WalletsState = createStore({
  name: "WalletsState",

  initialState: {
    wallets: [] as string[],
    balances: {} as Record<string, WalletBalances>,
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

async function load(api: StoreActionApi<typeof WalletsState.initialState>) {
  console.log("LOAD wallets");
  const wallets = _.merge(loadFromStorage(), api.getState().wallets);
  api.setState({ wallets });

  const network = await currentNetwork();
  if (!network) return;

  for (const wallet of wallets) {
    const fetched = await fetchBalances(PositionFactory.oracle, network, wallet);
    const balances = _.merge({}, api.getState().balances, { [wallet]: fetched } as Record<string, WalletBalances>);
    api.setState({ balances });
  }
}

export const useWalletsRows = createHook(WalletsState, { selector: (state) => state.wallets });

export const useWalletsBalancesRows = createHook(WalletsState, {
  selector: createSelector(
    (state) => state.balances,
    (allbalances) =>
      _(allbalances)
        .flatMap((balances, wallet) =>
          _.flatMap(balances, (amounts, network) =>
            _.map(amounts, (t) => ({
              id: `${wallet}:${network}:${t.asset.name}`,
              wallet,
              network,
              asset: t.asset.name,
              amount: to3(t.amount, 18).toNumber() / 1000,
              value: to3(t.value, 18).toNumber() / 1000,
            }))
          )
        )
        .filter((r) => r.value >= 1)
        .sortBy((r) => r.value)
        .reverse()
        .value()
  ),
});
