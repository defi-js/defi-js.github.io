import Web3 from "web3";
import { createHook, createStore } from "react-sweet-state";
import { account, Network, setWeb3Instance } from "@defi.org/web3-candies";
import { currentNetwork, networks } from "../positionsv1/base/consts";

// defaults.middlewares.add((storeState: any) => (next: any) => (arg: any) => {
//   const result = next(arg);
//   console.log(storeState.key, ":", storeState.getState());
//   return result;
// });

export function isNetworkDisabled(network?: Network) {
  return !network || network.id < 0;
}

const AppState = createStore({
  name: "AppState",

  initialState: {
    allNetworks: networks,
    loading: false,
    wallet: "",
    network: null as Network | null,
    alertDialog: "",
  },

  actions: {
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

    clickNetwork:
      (networkId: number) =>
      async ({ setState, getState }) => {
        await _withLoading(setState, async () => {
          if (!_ethereum()) {
            alert("install metamask");
            return;
          }

          _ethereum().removeAllListeners();
          _ethereum().on("chainChanged", async () => {
            await _onConnect(setState);
          });

          await _ethereum().request({ method: "eth_requestAccounts" });

          await _switchNetwork(networkId);

          if (!getState().network || getState().network?.id === networkId) {
            await _onConnect(setState);
          }
        });
      },
  },
});

function _ethereum() {
  return (window as any).ethereum;
}

async function _withLoading(setState: any, t: () => Promise<void>) {
  try {
    setState({ loading: true });
    await t();
  } catch (e: any) {
    alert(`${e.message} ${e.stack}`);
  } finally {
    setState({ loading: false });
  }
}

async function _onConnect(setState: any) {
  setState({ wallet: "", network: null });

  setWeb3Instance(new Web3(_ethereum()));
  const wallet = await account();
  const network = await currentNetwork();
  console.log("onConnect: network", network);

  if (isNetworkDisabled(network)) throw new Error(`network ${network?.name} not supported yet`);

  setState({ wallet, network });
}

async function _switchNetwork(networkId: number) {
  try {
    await _ethereum().request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: Web3.utils.numberToHex(networkId) }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    // if (switchError.code === 4902) {
    //   try {
    //     await ethereum.request({
    //       method: "wallet_addEthereumChain",
    //       params: [{ chainId: network.id, rpcUrl: network. }],
    //     });
    //   } catch (addError) {
    //     // handle "add" error
    //   }
    // }
    // handle other "switch" errors
  }
}

export const useAppState = createHook(AppState);
export const useIsAppConnected = createHook(AppState, {
  selector: (state) => Web3.utils.isAddress(state.wallet) && !!state.network?.id,
});
export const useIsLoading = createHook(AppState, {
  selector: (state) => state.loading,
});
export const useAppActions = createHook(AppState, {
  selector: null,
});
