import React from "react";
import { Button, TextField } from "@mui/material";
import { contract, fmt18, fmt6, web3 } from "@defi.org/web3-candies";
import { CompoundLoop } from "../../typechain-abi/CompoundLoop";
import { PositionUi } from "./PositionUi";

export class CompoundLoopUi extends PositionUi {
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
      const [liquidity, usdc, claimable] = await Promise.all([
        instance.methods.getAccountLiquidity().call(),
        instance.methods.underlyingBalance().call(),
        instance.methods["claimComp()"]().call(),
      ]);
      alert(`Liquidity: ${fmt18(liquidity.liquidity)}\nUSDC: ${fmt6(usdc)}\nClaimable: ${fmt18(claimable)}`);
    });
  }

  async claim() {
    await this.props.withLoading(async () => {
      const instance = this.getContract();
      await instance.methods.claimAndTransferAllCompToOwner().send({ from: this.props.owner, type: "0x2", maxPriorityFeePerGas: 10 } as any);
    });
  }

  private isAddressValid() {
    return web3().utils.isAddress(this.state.address);
  }

  private getContract() {
    return contract<CompoundLoop>(require("../abi/CompoundLoop.json"), this.state.address);
  }
}
