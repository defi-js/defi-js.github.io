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
      async ({ setState, getState, dispatch }) => {
        await dispatch(withLoading)(async () => {
          if (!(window as any).ethereum) alert("install metamask");
          await (window as any).ethereum.request({ method: "eth_requestAccounts" });

          setWeb3Instance(new Web3((window as any).ethereum));
          setState({ wallet: await account(), network: await getNetwork() });
          setState({ balance: bn(await web3().eth.getBalance(getState().wallet)) });
        });
      },
  },
});

export const withLoading = (store: StoreActionApi<typeof AppState.initialState>) => async (t: () => Promise<void>) => {
  try {
    store.setState({ loading: true });
    await t();
  } catch (e: any) {
    alert(`${e.message}`);
  } finally {
    store.setState({ loading: false });
  }
};

export const useAppState = createHook(AppState);
