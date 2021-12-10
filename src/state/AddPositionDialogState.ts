import { createHook, createStore } from "react-sweet-state";
import { PositionFactory } from "../positions/base/PositionFactory";

const AddPositionDialogState = createStore({
  name: "AddPositionDialogState",

  initialState: {
    show: false,
    type: "",
    address: "",
    valid: false,
    allTypes: PositionFactory.allTypes().sort(),
  },

  actions: {
    show:
      () =>
      async ({ setState }) => {
        setState({ show: true, type: "", address: "", valid: false });
      },

    closeDialog:
      () =>
      async ({ setState }) => {
        setState({ show: false });
      },

    setType:
      (type: string) =>
      async ({ setState, getState }) => {
        const valid = PositionFactory.isValidArgs(type, getState().address);
        setState({ type, valid });
      },

    setAddress:
      (address: string) =>
      async ({ setState, getState }) => {
        const valid = PositionFactory.isValidArgs(getState().type, address);
        setState({ address, valid });
      },
  },
});

export const useAddPositionDialog = createHook(AddPositionDialogState);
