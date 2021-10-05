import React from "react";
import { Button, TextField } from "@mui/material";
import { contract, fmt18, fmt6, web3 } from "@defi.org/web3-candies";
import { PositionUi } from "./PositionUi";
import { AaveLoop } from "../../typechain-abi/AaveLoop";

export class AaveLoopUi extends PositionUi {
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
          onChange={(event) => this.setState({ address: event.target.value })}
        />

        <Button sx={{ m: 2 }} variant={"contained"} size={"large"} onClick={this.status.bind(this)} disabled={!this.isAddressValid()}>
          Status
        </Button>
        <Button sx={{ m: 2 }} variant={"contained"} size={"large"} onClick={this.claim.bind(this)} disabled={!this.isAddressValid()}>
          Claim
        </Button>
      </div>
    );
  }

  async status() {
    await this.props.withLoading(async () => {
      const instance = this.getContract();
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
    });
  }

  async claim() {
    await this.props.withLoading(async () => {
      const instance = this.getContract();
      await instance.methods.claimRewardsToOwner().send({ from: this.props.owner, type: "0x0" } as any);
    });
  }

  private isAddressValid() {
    return web3().utils.isAddress(this.state.address);
  }

  private getContract() {
    return contract<AaveLoop>(require("../abi/AaveLoop.json"), this.state.address);
  }
}
