import { createHook, createStore } from "react-sweet-state";

const AppState = createStore({
  name: "PositionsState",

  initialState: {},

  actions: {
    addPosition:
      () =>
      async ({ setState, getState }) => {
        //
      },
  },
});

export const usePositionsState = createHook(AppState);
