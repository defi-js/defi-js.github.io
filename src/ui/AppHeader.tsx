import React from "react";
import { AddPositionBtn } from "./AddPositionDialog";
import { useAppState, useIsAppConnected } from "../state/AppState";
import { Button } from "@mui/material";
import { fmt18 } from "@defi.org/web3-candies";
import { AddWalletBtn } from "./AddWalletDialog";

export const AppHeader = () => (
  <div style={{ fontSize: "medium", minWidth: "42em" }}>
    <br />
    <br />

    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}>
      <ConnectBtn />
      <AddWalletBtn />
      <AddPositionBtn />
    </div>

    <div />
    <WalletInfo />
    <div />

    <br />
  </div>
);

const ConnectBtn = () => {
  const [isConnected, actions] = useIsAppConnected();

  return (
    <Button variant={"contained"} size={"large"} onClick={actions.connect}>
      {isConnected ? "Refresh" : "Connect"}
    </Button>
  );
};

const WalletInfo = () => {
  const [state] = useAppState();
  return (
    <div>
      <br />
      <div>Network 🌐 {state.network?.name}</div>
      <div>Wallet 🔑 {state.wallet}</div>
      <div>Balance 💰 {fmt18(state.balance)}</div>
    </div>
  );
};
