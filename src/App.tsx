import React from "react";
import Web3 from "web3";
import "./App.css";

import { account, bn, fmt18, getNetwork, Network, setWeb3Instance, web3, zero } from "@defi.org/web3-candies";
import { Backdrop, Button, CircularProgress, createTheme, FormControlLabel, FormGroup, Switch, ThemeProvider } from "@mui/material";
import { AaveLoopUi } from "./positions/AaveLoopUi";
import { CompoundLoopUi } from "./positions/CompoundLoopUi";

export default class App extends React.Component {
  state = {
    loading: false,
    owner: "",
    balance: zero,
    network: {} as Network,

    useLegacyTx: false,
    displayUi: null,
  };

  isConnected() {
    return Web3.utils.isAddress(this.state.owner);
  }

  render() {
    const darkTheme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return (
      <ThemeProvider theme={darkTheme}>
        <div className="App">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={this.state.useLegacyTx} onChange={(e: any) => this.setState({ useLegacyTx: e.target.checked })} />}
              label="Use Legacy Transaction"
            />
          </FormGroup>

          <p />

          <Button variant={"contained"} size={"large"} onClick={this.connect.bind(this)}>
            Connect
          </Button>

          {this.isConnected() && (
            <div>
              <p>Network 🌐 {this.state.network?.name}</p>
              <p>Wallet 🔑 {this.state.owner}</p>
              <p>Balance 💰 {fmt18(this.state.balance)} ETH</p>

              {!this.state.displayUi && (
                <p>
                  <Button variant={"contained"} size={"large"} onClick={() => this.setState({ displayUi: AaveLoopUi })}>
                    Aave Loop
                  </Button>
                  <p />
                  <Button variant={"contained"} size={"large"} onClick={() => this.setState({ displayUi: CompoundLoopUi })}>
                    Compound Loop
                  </Button>
                </p>
              )}

              {this.state.displayUi && (
                <div>
                  {React.createElement(this.state.displayUi, {
                    owner: this.state.owner,
                    useLegacyTx: this.state.useLegacyTx,
                    withLoading: this.withLoading.bind(this),
                  })}
                </div>
              )}
            </div>
          )}

          <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={this.state.loading}>
            <CircularProgress color="inherit" />
          </Backdrop>
        </div>
      </ThemeProvider>
    );
  }

  setState(state: any, callback?: () => void) {
    super.setState(state, callback);
    console.log("setState", JSON.stringify(state, null, 2));
  }

  async withLoading(t: () => Promise<void>) {
    try {
      this.setState({ loading: true });
      await t();
    } catch (e: any) {
      alert(`${e.message}`);
    } finally {
      this.setState({ loading: false });
    }
  }

  async connect() {
    this.setState({ loading: true });
    if (!(window as any).ethereum) alert("install metamask");
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    setWeb3Instance(new Web3((window as any).ethereum));

    this.setState({ loading: false, owner: await account(), network: await getNetwork(), displayUi: null });

    this.setState({ balance: bn(await web3().eth.getBalance(this.state.owner)) });
  }
}
