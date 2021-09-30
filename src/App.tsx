import React from "react";
import Web3 from "web3";
import "./App.css";
import _ from "lodash";

import { account, bn, fmt18, getNetwork, Network, setWeb3Instance, web3, zero } from "@defi.org/web3-candies";
import { Backdrop, Button, CircularProgress, createTheme, ThemeProvider } from "@mui/material";
import { AaveLoopUi } from "./positions/AaveLoopUi";
import { CompoundLoopUi } from "./positions/CompoundLoopUi";

export default class App extends React.Component {
  state = {
    loading: false,
    owner: "",
    balance: zero,
    network: {} as Network,
  };

  render() {
    const darkTheme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return (
      <ThemeProvider theme={darkTheme}>
        <div className="App">
          <Button variant={"contained"} size={"large"} onClick={this.connect.bind(this)}>
            Connect
          </Button>

          {this.state.owner.length > 0 && (
            <div>
              <p>Wallet 🔑 {this.state.owner}</p>
              <p>Network 🌐 ${this.state.network?.name}</p>
              <p>Balance 💰 ${fmt18(this.state.balance)} ETH</p>

              <AaveLoopUi owner={this.state.owner} setLoading={(l) => this.setState({ ...this.state, loading: l })} />

              <CompoundLoopUi owner={this.state.owner} setLoading={(l) => this.setState({ ...this.state, loading: l })} />
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
    console.log("setState", state);
  }

  async connect() {
    this.setState({ ...this.state, loading: true });
    if (!(window as any).ethereum) alert("install metamask");
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    setWeb3Instance(new Web3((window as any).ethereum));

    this.setState({ ...this.state, loading: false, owner: await account(), network: await getNetwork() });

    this.setState({ ...this.state, balance: bn(await web3().eth.getBalance(this.state.owner)) });
  }
}
