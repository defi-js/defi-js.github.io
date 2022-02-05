import { createHook, createStore } from "react-sweet-state";
import { PositionFactory } from "../positions/base/PositionFactory";
import _ from "lodash";

const AddPositionDialogState = createStore({
  name: "AddPositionDialogState",

  initialState: {
    show: false,
    type: "",
    address: "",
    input: "",
    name: "",
    valid: false,
    allTypes: PositionFactory.allTypes().sort(),
  },

  actions: {
    show:
      () =>
      async ({ setState }) => {
        setState({ show: true, type: "", address: "", input: "", name: "", valid: false });
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
        address = _.trim(address);
        const valid = PositionFactory.isValidArgs(getState().type, address);
        setState({ address, valid });
      },

    setInput:
      (input: string) =>
      async ({ setState }) => {
        input = _.trim(input);
        setState({ input });
      },

    setName:
      (name: string) =>
      async ({ setState }) => {
        name = _.trim(name);
        setState({ name });
      },
  },
});

export const useAddPositionDialog = createHook(AddPositionDialogState);
