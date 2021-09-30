import React from "react";
import { Button, TextField } from "@mui/material";
import { contract, fmt18, fmt6, web3 } from "@defi.org/web3-candies";
import { AaveLoop } from "../../typechain-abi/AaveLoop";

export class AaveLoopUi extends React.Component<{ owner: string; setLoading: (l: boolean) => void }> {
  state = {
    address: "",
  };

  render() {
    return (
      <div>
        <h3>AaveLoop</h3>
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
      const instance = contract<AaveLoop>(require("../abi/AaveLoop.json"), this.state.address);
      const [posData, usdc, rewards] = await Promise.all([
        instance.methods.getPositionData().call(),
        instance.methods.getBalanceUSDC().call(),
        instance.methods.getBalanceReward().call(),
      ]);
      alert(
        `HealthFactor: ${fmt18(posData.healthFactor)}\nCollateralETH: ${fmt18(posData.totalCollateralETH)}\nDebtETH: ${fmt18(posData.totalDebtETH)}\nUSDC: ${fmt6(
          usdc
        )}\nRewards: ${fmt18(rewards)}`
      );
    } finally {
      this.props.setLoading(false);
    }
  }

  async claim() {
    if (!this.state.address) return;
    this.props.setLoading(true);
    try {
      const instance = contract<AaveLoop>(require("../abi/AaveLoop.json"), this.state.address);
      await instance.methods.claimRewardsToOwner().send({ from: this.props.owner });
    } finally {
      this.props.setLoading(false);
    }
  }
}
