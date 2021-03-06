import React from "react";
import { useAppActions, useIsAppConnected } from "../state/AppState";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useAllPositionsActions } from "../state/AllPositionsState";
import { useAddPositionDialog } from "../state/AddPositionDialogState";

export const AddPositionBtn = () => {
  const [isConnected] = useIsAppConnected();
  const [, actions] = useAddPositionDialog();
  return (
    <Button disabled={!isConnected} onClick={() => actions.show()}>
      + Position
    </Button>
  );
};

export const AddPositionDialog = () => {
  const [, appActions] = useAppActions();
  const [state, actions] = useAddPositionDialog();
  const [, allPositionActions] = useAllPositionsActions();

  const close = () => actions.closeDialog();

  const add = () => appActions.withLoading(() => allPositionActions.addPosition(state.type, state.address, state.input, state.name)).then(close);

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
          {<TextField fullWidth id="outlined-basic" variant="outlined" label="Name?" onChange={(e) => actions.setName(e.target.value)} />}

          <br />
          <br />
          {<TextField fullWidth id="outlined-basic" variant="outlined" label="Input?" onChange={(e) => actions.setInput(e.target.value)} />}

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
