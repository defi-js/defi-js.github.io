import React from "react";
import { useAppState } from "../state/AppState";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

let memAlert = "";

export const AlertDialog = () => {
  const [appState, appStateActions] = useAppState();
  memAlert = appState.alertDialog || memAlert;

  const close = () => appStateActions.showAlert("");

  return (
    <div>
      <Dialog open={!!appState.alertDialog} onClose={close}>
        <DialogTitle style={{ minWidth: "28em" }}>Alert</DialogTitle>

        <DialogContent>
          <DialogContentText style={{ whiteSpace: "pre" }}>{memAlert}</DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button size="large" onClick={close}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
