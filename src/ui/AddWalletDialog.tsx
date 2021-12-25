import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemButton, ListItemText, TextField } from "@mui/material";
import { useAppActions, useIsAppConnected } from "../state/AppState";
import { useAddWalletDialog } from "../state/AddWalletDialogState";
import _ from "lodash";
import { useWalletsRows } from "../state/WalletsState";

export const AddWalletBtn = () => {
  const [isConnected] = useIsAppConnected();
  const [, actions] = useAddWalletDialog();
  return (
    <Button disabled={!isConnected} onClick={() => actions.show()}>
      + Wallet
    </Button>
  );
};

export const AddWalletDialog = () => {
  const [, appActions] = useAppActions();
  const [state, actions] = useAddWalletDialog();
  const [wallets, walletsActions] = useWalletsRows();

  const close = () => actions.closeDialog();

  const add = () => appActions.withLoading(() => walletsActions.add(state.address)).then(close);

  return (
    <div>
      <Dialog open={state.show} onClose={close}>
        <DialogTitle style={{ minWidth: "28em" }}>Add Wallet</DialogTitle>

        <DialogContent>
          <br />
          <TextField fullWidth id="outlined-basic" variant="outlined" label="Wallet Address" onChange={(e) => actions.setAddress(e.target.value)} />

          <br />
          <br />

          <div>Tracking:</div>
          <List>
            {_.map(wallets, (w) => (
              <ListItem key={w} disablePadding>
                <ListItemButton>
                  <ListItemText primary={w} onClick={() => appActions.withLoading(() => walletsActions.delete(w))} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
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
