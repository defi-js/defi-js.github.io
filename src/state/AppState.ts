import Web3 from "web3";
import { createHook, createStore, defaults, StoreActionApi } from "react-sweet-state";
import { account, bn, getNetwork, Network, setWeb3Instance, web3, zero } from "@defi.org/web3-candies";

defaults.middlewares.add((storeState: any) => (next: any) => (arg: any) => {
  const result = next(arg);
  console.log(storeState.key, ":", storeState.getState());
  return result;
});

const AppState = createStore({
  name: "AppState",

  initialState: {
    loading: false,
    useLegacyTx: false,
    wallet: "",
    balance: zero,
    network: {} as Network,
  },

  actions: {
    setUseLegacyTx:
      (useLegacyTx: boolean) =>
      ({ setState, dispatch }) => {
        setState({ useLegacyTx });
        // dispatch((store) => {});
      },

    connect:
      () =>
      async ({ setState, dispatch }) => {
        await dispatch(withLoading)(async () => {
          const ethereum = (window as any).ethereum;
          if (!ethereum) {
            alert("install metamask");
            return;
          }

          setWeb3Instance(new Web3(ethereum));
          ethereum.enable();

          ethereum.on("accountsChanged", () => {
            onConnect(setState);
          });
          ethereum.on("networkChanged", () => {
            onConnect(setState);
          });

          await onConnect(setState);
        });
      },
  },
});

const withLoading = (store: StoreActionApi<typeof AppState.initialState>) => async (t: () => Promise<void>) => {
  try {
    store.setState({ loading: true });
    await t();
  } catch (e: any) {
    alert(`${e.message}`);
  } finally {
    store.setState({ loading: false });
  }
};

async function onConnect(setState: any) {
  const wallet = await account();
  setState({ wallet, network: await getNetwork(), balance: bn(await web3().eth.getBalance(wallet)) });
}

export const useAppState = createHook(AppState);
