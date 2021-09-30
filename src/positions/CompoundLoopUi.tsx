import React from "react";
import { Button, TextField } from "@mui/material";
import { contract, fmt18, fmt6, web3 } from "@defi.org/web3-candies";
import { CompoundLoop } from "../../typechain-abi/CompoundLoop";

export class CompoundLoopUi extends React.Component<{ owner: string; setLoading: (l: boolean) => void }> {
  state = {
    address: "",
  };

  render() {
    return (
      <div>
        <h3>CompoundLoop</h3>
        <TextField
          fullWidth
          id="outlined-basic"
          label="Contract Address"
          variant="outlined"
          sx={{ minWidth: "200%", marginLeft: "-50%" }}
          onChange={(event) => this.setState({ ...this.state, address: event.target.value })}
        />

        <Button
          sx={{ m: 2 }}
          variant={"contained"}
          size={"large"}
          onClick={this.status.bind(this)}
          disabled={!this.state.address.length || !web3().utils.isAddress(this.state.address)}
        >
          Status
        </Button>
        <Button
          sx={{ m: 2 }}
          variant={"contained"}
          size={"large"}
          onClick={this.claim.bind(this)}
          disabled={!this.state.address.length || !web3().utils.isAddress(this.state.address)}
        >
          Claim
        </Button>
      </div>
    );
  }

  async status() {
    if (!this.state.address) return;
    this.props.setLoading(true);
    try {
      const instance = contract<CompoundLoop>(require("../abi/CompoundLoop.json"), this.state.address);
      const [liquidity, usdc, claimable] = await Promise.all([
        instance.methods.getAccountLiquidity().call(),
        instance.methods.underlyingBalance().call(),
        instance.methods["claimComp()"]().call(),
      ]);
      alert(`Liquidity: ${fmt18(liquidity.liquidity)}\nUSDC: ${fmt6(usdc)}\nClaimable: ${fmt18(claimable)}`);
    } finally {
      this.props.setLoading(false);
    }
  }

  async claim() {
    if (!this.state.address) return;
    this.props.setLoading(true);
    try {
      const instance = contract<CompoundLoop>(require("../abi/CompoundLoop.json"), this.state.address);
      await instance.methods.claimAndTransferAllCompToOwner().send({ from: this.props.owner });
    } finally {
      this.props.setLoading(false);
    }
  }
}
