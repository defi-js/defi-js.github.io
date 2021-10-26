import { createHook, createStore, defaults } from "react-sweet-state";
import { account, bn, contract, fmt18, fmt6, getNetwork, Network, setWeb3Instance, web3, zero } from "@defi.org/web3-candies";
import Web3 from "web3";
import { AaveLoop } from "../../typechain-abi/AaveLoop";
import { CompoundLoop } from "../../typechain-abi/CompoundLoop";

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

    // TODO temp
    displayPositionUI: null as "AaveLoopComponent" | "CompoundLoopComponent" | null,
  },

  actions: {
    setUseLegacyTx:
      (useLegacyTx: boolean) =>
      ({ setState }) => {
        setState({ useLegacyTx });
      },

    connect:
      () =>
      async ({ setState, getState }) => {
        setState({ loading: true });
        if (!(window as any).ethereum) alert("install metamask");
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });

        setWeb3Instance(new Web3((window as any).ethereum));
        setState({ wallet: await account(), network: await getNetwork() });
        setState({ balance: bn(await web3().eth.getBalance(getState().wallet)), loading: false });
      },

    showPosition:
      (position) =>
      async ({ setState }) => {
        setState({ displayPositionUI: position });
      },

    positionAaveLoopStatus:
      (contractAddress: string) =>
      async ({ setState }) => {
        await withLoading(setState, async () => {
          const instance = aaveLoop(contractAddress);
          const [posData, usdc, rewards] = await Promise.all([
            instance.methods.getPositionData().call(),
            instance.methods.getBalanceUSDC().call(),
            instance.methods.getBalanceReward().call(),
          ]);
          alert(
            `HealthFactor: ${fmt18(posData.healthFactor)}\nCollateralETH: ${fmt18(posData.totalCollateralETH)}\nDebtETH: ${fmt18(posData.totalDebtETH)}\nUSDC: ${fmt6(
              usdc
            )}\nRewards: ${fmt18(rewards)}`
          );
        });
      },

    positionAaveLoopClaim:
      (contractAddress: string) =>
      async ({ setState, getState }) => {
        await withLoading(setState, async () => {
          const instance = aaveLoop(contractAddress);
          await instance.methods.claimRewardsToOwner().send({ from: getState().wallet, type: getState().useLegacyTx ? "0x0" : "0x2" } as any);
        });
      },

    positionCompoundLoopStatus:
      (contractAddress: string) =>
      async ({ setState }) => {
        await withLoading(setState, async () => {
          const instance = compoundLoop(contractAddress);
          const [liquidity, usdc, claimable] = await Promise.all([
            instance.methods.getAccountLiquidity().call(),
            instance.methods.underlyingBalance().call(),
            instance.methods["claimComp()"]().call(),
          ]);
          alert(`Liquidity: ${fmt18(liquidity.liquidity)}\nUSDC: ${fmt6(usdc)}\nClaimable: ${fmt18(claimable)}`);
        });
      },

    positionCompoundLoopClaim:
      (contractAddress: string) =>
      async ({ setState, getState }) => {
        await withLoading(setState, async () => {
          const instance = compoundLoop(contractAddress);
          await instance.methods.claimAndTransferAllCompToOwner().send({ from: getState().wallet, type: getState().useLegacyTx ? "0x0" : "0x2" } as any);
        });
      },
  },
});

function aaveLoop(contractAddress: string) {
  return contract<AaveLoop>(require("../abi/AaveLoop.json"), contractAddress);
}

function compoundLoop(contractAddress: string) {
  return contract<CompoundLoop>(require("../abi/CompoundLoop.json"), contractAddress);
}

async function withLoading(setState: any, t: () => Promise<void>) {
  try {
    setState({ loading: true });
    await t();
  } catch (e: any) {
    alert(`${e.message}`);
  } finally {
    setState({ loading: false });
  }
}

export const useAppState = createHook(AppState);
export const useIsValidAddress = createHook(AppState, {
  selector: (state, address: string) => Web3.utils.isAddress(address),
});
