import React, { useState } from "react";
import { Button, TextField } from "@mui/material";
import { useAppState, useIsValidAddress } from "../state/AppState";

export const AaveLoopComponent = () => {
  const [mystate, setMyState] = useState({ contract: "" });
  const [isAddressValid] = useIsValidAddress(mystate.contract);
  const [, actions] = useAppState();

  return (
    <div>
      <h3>AaveLoop</h3>
      <TextField
        fullWidth
        id="outlined-basic"
        label="Contract Address"
        variant="outlined"
        sx={{ minWidth: "200%", marginLeft: "-50%" }}
        onChange={(event) => setMyState({ contract: event.target.value })}
      />

      <Button sx={{ m: 2 }} variant={"contained"} size={"large"} onClick={() => actions.positionAaveLoopStatus(mystate.contract)} disabled={!isAddressValid}>
        Status
      </Button>
      <Button sx={{ m: 2 }} variant={"contained"} size={"large"} onClick={() => actions.positionAaveLoopClaim(mystate.contract)} disabled={!isAddressValid}>
        Claim
      </Button>
    </div>
  );
};
