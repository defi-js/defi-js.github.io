import Web3 from "web3";
import { createHook, createStore } from "react-sweet-state";
import { account, bn, getNetwork, Network, setWeb3Instance, web3, zero } from "@defi.org/web3-candies";

// defaults.middlewares.add((storeState: any) => (next: any) => (arg: any) => {
//   const result = next(arg);
//   console.log(storeState.key, ":", storeState.getState());
//   return result;
// });

const AppState = createStore({
  name: "AppState",

  initialState: {
    loading: false,
    wallet: "",
    balance: zero,
    network: {} as Network,

    alertDialog: "",
  },

  actions: {
    connect:
      () =>
      async ({ setState }) => {
        await _withLoading(setState, async () => {
          setState({ wallet: "", balance: zero, network: {} as Network });

          const ethereum = (window as any).ethereum;
          if (!ethereum) {
            alert("install metamask");
            return;
          }
          await _onConnect(setState, ethereum);

          ethereum.on("accountsChanged", () => {
            _onConnect(setState, ethereum);
          });
          ethereum.on("chainChanged", () => {
            _onConnect(setState, ethereum);
          });
        });
      },

    withLoading:
      (thunk: () => any) =>
      async ({ setState }) => {
        await _withLoading(setState, thunk);
      },

    showAlert:
      (alert: string) =>
      async ({ setState }) => {
        setState({ alertDialog: alert });
      },
  },
});

async function _withLoading(setState: any, t: () => Promise<void>) {
  try {
    setState({ loading: true });
    await t();
  } catch (e: any) {
    alert(`${e.message}`);
  } finally {
    setState({ loading: false });
  }
}

async function _onConnect(setState: any, ethereum: any) {
  setWeb3Instance(new Web3(ethereum));
  const wallet = await account();
  setState({
    wallet,
    network: await getNetwork(),
    balance: bn(await web3().eth.getBalance(wallet)),
  });
}

export const useAppState = createHook(AppState);
export const useIsAppConnected = createHook(AppState, {
  selector: (state) => Web3.utils.isAddress(state.wallet),
});
