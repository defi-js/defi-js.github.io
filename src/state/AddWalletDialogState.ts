import { createHook, createStore } from "react-sweet-state";
import { PositionFactory } from "../positions/base/PositionFactory";

const AddWalletDialogState = createStore({
  name: "AddWalletDialogState",

  initialState: {
    show: false,
    address: "",
    valid: false,
  },

  actions: {
    show:
      () =>
      async ({ setState }) => {
        setState({ show: true, address: "", valid: false });
      },

    closeDialog:
      () =>
      async ({ setState }) => {
        setState({ show: false });
      },

    setAddress:
      (address: string) =>
      async ({ setState }) => {
        const valid = PositionFactory.isValidWallet(address);
        setState({ address, valid });
      },
  },
});

export const useAddWalletDialog = createHook(AddWalletDialogState);
