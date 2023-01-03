import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { usePositionDialogSelector } from "../state/PositionDialogState";
import { useAppState } from "../state/AppState";
import { useAllPositions } from "../state/AllPositionsState";

export const PositionDialog = () => {
  const [, appStateActions] = useAppState();
  const [selector, actions] = usePositionDialogSelector(undefined);
  const [, allPositionsActions] = useAllPositions();

  const close = () => actions.closeDialog();

  const deletePos = () => appStateActions.withLoading(() => allPositionsActions.delete(selector.position!.getArgs().id)).then(close);

  // const updatePos = () => appStateActions.withLoading(() => allPositionsActions.update(selector.position!, selector.position!.getArgs())).then(close);

  const showData = () => appStateActions.showAlert(selector.rawData);

  const harvest = () => appStateActions.withLoading(() => actions.harvest()).then(close);

  const send = () => appStateActions.withLoading(() => actions.send()).then(close);

  const call = () => appStateActions.withLoading(() => actions.call(appStateActions.showAlert));

  return (
    <div>
      <Dialog open={!!selector.position} onClose={close}>
        <DialogTitle>Position: {selector.position?.getArgs()?.name || selector.position?.getArgs()?.type}</DialogTitle>
        <DialogContent>
          <DialogContentText>Network: {selector.position?.getNetwork()?.name}</DialogContentText>
          <DialogContentText>Address: {selector.position?.getArgs()?.address}</DialogContentText>
          {selector.position?.getArgs()?.input && <DialogContentText>Input: {selector.position?.getArgs()?.input}</DialogContentText>}

          <br />
          <FormControl fullWidth>
            <InputLabel>Method</InputLabel>
            <Select value={selector.selectedMethod} label="Method" onChange={(e) => actions.selectMethod(e.target.value)}>
              {selector.positionMethods.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <br />
          {selector.selectedMethodArgTypes.length > 0 &&
            selector.selectedMethodArgTypes.map((argType, i) => (
              <TextField
                key={argType + i}
                autoFocus
                margin="dense"
                id={argType + i}
                label={argType}
                type="text"
                fullWidth
                variant="standard"
                onChange={(e) => actions.setMethodArg(i, e.target.value)}
              />
            ))}

          <br />
          <br />

          <FormGroup>
            <FormControlLabel control={<Switch checked={selector.useLegacy} onChange={(e: any) => actions.setUseLegacy(e.target.checked)} />} label="Use Legacy Transaction Type" />
          </FormGroup>
        </DialogContent>

        <DialogActions>
          <Button onClick={deletePos}>Delete Position</Button>

          <Button onClick={showData}>Show Data</Button>

          <Button onClick={harvest}>Just Harvest</Button>

          <Button disabled={!selector.selectedMethod} onClick={call}>
            Call Contract
          </Button>

          <Button disabled={!selector.selectedMethod} onClick={send}>
            Send Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
