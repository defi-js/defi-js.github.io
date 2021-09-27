import React from "react";
import "./App.css";

import Web3 from "web3";
import { account, bn, fmt18, setWeb3Instance, web3, zero } from "@defi.org/web3-candies";

import { Backdrop, Button, CircularProgress, createTheme, ThemeProvider } from "@mui/material";
import { CustomAbi } from "./CustomAbi";

export default class App extends React.Component {
  state = {
    loading: false,
    owner: "",
    balance: zero,
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

          <p>
            Wallet {this.state.owner} 💰 {!this.state.balance.isZero() && `Balance ${fmt18(this.state.balance)} ETH`}
          </p>

          {this.state.owner.length > 0 && <CustomAbi owner={this.state.owner} setLoading={(l) => this.setState({ ...this.state, loading: l })} />}

          <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={this.state.loading}>
            <CircularProgress color="inherit" />
          </Backdrop>
        </div>
      </ThemeProvider>
    );
  }

  async connect() {
    this.setState({ ...this.state, loading: true });
    if (!(window as any).ethereum) alert("install metamask");
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    setWeb3Instance(new Web3((window as any).ethereum));

    console.log("Web3", web3().version);
    this.setState({ ...this.state, loading: false, owner: await account() });
    console.log("Wallet", this.state.owner);

    this.setState({ ...this.state, balance: bn(await web3().eth.getBalance(this.state.owner)) });
  }
}
