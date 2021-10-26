import React from "react";
import "./App.css";
import { Backdrop, Button, CircularProgress, createTheme, FormControlLabel, FormGroup, Switch, ThemeProvider } from "@mui/material";
import { useAppState, useIsValidAddress } from "./state/AppState";
import { fmt18 } from "@defi.org/web3-candies";
import { AaveLoopComponent } from "./positions/AaveLoopComponent";
import { CompoundLoopComponent } from "./positions/CompoundLoopComponent";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        <div className="Header">
          <p />
          <div className="Connect">
            <ConnectBtn />
            <UseLegacyTx />
          </div>

          <p />
          <WalletInfo />
          <p />
        </div>

        <div>
          <PositionsMenu />
          <p />
          <PositionUI />
        </div>

        <div>
          <Loading />
        </div>
      </div>
    </ThemeProvider>
  );
};

const UseLegacyTx = () => {
  const [state, actions] = useAppState();
  return (
    <FormGroup>
      <FormControlLabel control={<Switch checked={state.useLegacyTx} onChange={(e: any) => actions.setUseLegacyTx(e.target.checked)} />} label="Use Legacy Transaction" />
    </FormGroup>
  );
};

const ConnectBtn = () => {
  const [state, actions] = useAppState();
  const [isConnected] = useIsValidAddress(state.wallet);
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
      <p>Network 🌐 {state.network?.name}</p>
      <p>Wallet 🔑 {state.wallet}</p>
      <p>Balance 💰 {fmt18(state.balance)} ETH</p>
    </div>
  );
};

const Loading = () => {
  const [state] = useAppState();
  return (
    <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={state.loading}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

const PositionsMenu = () => {
  const [state, actions] = useAppState();
  const [isConnected] = useIsValidAddress(state.wallet);
  if (!isConnected) return <div />;

  return (
    <div>
      <Button variant={"contained"} size={"large"} onClick={() => actions.showPosition("AaveLoopComponent")}>
        Aave Loop
      </Button>
      <p />
      <Button variant={"contained"} size={"large"} onClick={() => actions.showPosition("CompoundLoopComponent")}>
        Compound Loop
      </Button>
    </div>
  );
};

// TODO temp
function getUi(name: string) {
  switch (name) {
    case "AaveLoopComponent":
      return <AaveLoopComponent />;
    case "CompoundLoopComponent":
      return <CompoundLoopComponent />;
    default:
      return <div />;
  }
}

const PositionUI = () => {
  const [state] = useAppState();
  const [isConnected] = useIsValidAddress(state.wallet);
  if (!isConnected || !state.displayPositionUI) return <div />;

  return getUi(state.displayPositionUI);
};
