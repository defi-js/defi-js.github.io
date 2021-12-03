import React from "react";
import { useAppState, useIsAppConnected } from "../state/AppState";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useAllPositionsActions } from "../state/AllPositionsState";
import { useAddPositionDialog } from "../state/AddPositionDialogState";

export const AddPositionBtn = () => {
  const [isConnected] = useIsAppConnected();
  const [, actions] = useAddPositionDialog();
  return (
    <Button variant={"contained"} size={"large"} disabled={!isConnected} onClick={() => actions.show()}>
      Add Position
    </Button>
  );
};

export const AddPositionDialog = () => {
  const [, appStateActions] = useAppState();
  const [state, actions] = useAddPositionDialog();
  const [, allPositionActions] = useAllPositionsActions();

  const close = () => actions.closeDialog();

  const add = () => appStateActions.withLoading(() => allPositionActions.addPosition(state.type, state.address)).then(close);

  return (
    <div>
      <Dialog open={state.show} onClose={close}>
        <DialogTitle style={{ minWidth: "28em" }}>Add Position</DialogTitle>

        <DialogContent>
          <br />
          <FormControl fullWidth>
            <InputLabel>Position Type</InputLabel>
            <Select value={state.type} label="Position Type" onChange={(e) => actions.setType(e.target.value)}>
              <MenuItem value="" />
              {state.allTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <br />
          <br />
          <TextField fullWidth id="outlined-basic" variant="outlined" label="Target Address" onChange={(e) => actions.setAddress(e.target.value)} />

          <br />
          <br />
        </DialogContent>
        <DialogActions>
          <Button size="large" disabled={!state.valid} onClick={add}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
