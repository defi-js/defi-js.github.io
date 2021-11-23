import React, { useMemo, useState } from "react";
import "./App.css";
import {
  Backdrop,
  Button,
  CircularProgress,
  createTheme,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  ThemeProvider,
} from "@mui/material";
import { useAppState } from "./state/AppState";
import { fmt18, getNetwork } from "@defi.org/web3-candies";
import { useAddPosition, useUpdatedPositionRows, usePositionsActions } from "./state/PositionsState";
import { Position, PositionArgs, Threat, TokenAmount } from "./positions/base/Position";
import Web3 from "web3";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import _ from "lodash";
import { PositionFactory } from "./positions/base/PositionFactory";
import BN from "bn.js";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        <div className="Header">
          <p />
          <div className="Connect">
            <ConnectBtn />
            <UseLegacyTx />
          </div>

          <p />
          <WalletInfo />
          <p />
        </div>

        <p />

        <AddPosition />

        <p />

        <PositionsUI />

        <p />

        <div>
          <Loading />
        </div>
      </div>
    </ThemeProvider>
  );
};

const UseLegacyTx = () => {
  const [state, actions] = useAppState();
  return (
    <FormGroup>
      <FormControlLabel control={<Switch checked={state.useLegacyTx} onChange={(e: any) => actions.setUseLegacyTx(e.target.checked)} />} label="Use Legacy Transaction" />
    </FormGroup>
  );
};

const ConnectBtn = () => {
  const [state, actions] = useAppState();
  const isConnected = Web3.utils.isAddress(state.wallet);
  return (
    <Button variant={"contained"} size={"large"} onClick={actions.connect}>
      {isConnected ? "Refresh" : "Connect"}
    </Button>
  );
};

const WalletInfo = () => {
  const [state] = useAppState();
  return (
    <div>
      <p>Network 🌐 {state.network?.name}</p>
      <p>Wallet 🔑 {state.wallet}</p>
      <p>Balance 💰 {fmt18(state.balance)} ETH</p>
    </div>
  );
};

const Loading = () => {
  const [state] = useAppState();
  return (
    <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={state.loading}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

const AddPosition = () => {
  const [appState] = useAppState();
  const [myState, setMyState] = useState(() => ({} as PositionArgs));
  const [addPosState, actions] = useAddPosition(myState);

  return (
    <div>
      <FormControl sx={{ width: "100%" }}>
        <InputLabel id="demo-simple-select-label">Position Type</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={myState.type || ""}
          label="Position Type"
          onChange={(event: SelectChangeEvent) => setMyState({ ...myState, type: event.target.value })}
        >
          <MenuItem value="" />
          {addPosState.allTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        sx={{ marginTop: "2%" }}
        fullWidth
        id="outlined-basic"
        variant="outlined"
        label="Target Address"
        onChange={(event: any) => setMyState({ ...myState, address: event.target.value })}
      />

      <Button
        sx={{ marginTop: "2%" }}
        variant={"contained"}
        size={"large"}
        onClick={() => actions.addPosition(myState).then(() => setMyState({} as PositionArgs))}
        disabled={!appState.wallet || !addPosState.isValid || !myState.type}
      >
        Add Position
      </Button>
    </div>
  );
};

const RenderCellClaim = (params: any) => {
  const [state] = useAppState();
  const [, actions] = usePositionsActions();
  return (
    <ListItemButton onClick={() => actions.claim(params.id, state.useLegacyTx)}>
      <ListItemText primary="Claim" />
    </ListItemButton>
  );
};
const RenderCellDelete = (params: any) => {
  const [count, setCount] = useState(0);
  const [, actions] = usePositionsActions();
  return (
    <ListItemButton
      onClick={() => {
        if (count > 4) {
          setCount(0);
          return actions.delete(params.id);
        } else setCount(count + 1);
      }}
    >
      <ListItemText primary="Delete" />
    </ListItemButton>
  );
};

const columns: GridColDef[] = [
  { field: "type", headerName: "Type", width: 300 },
  { field: "amounts", headerName: "Amounts", width: 700 },
  { field: "pending", headerName: "Pending", width: 300 },
  { field: "health", headerName: "Health", width: 100 },
  {
    field: "claim",
    headerName: "Claim",
    width: 100,
    type: "actions",
    renderCell: RenderCellClaim,
  },
  {
    field: "delete",
    headerName: "Delete",
    width: 50,
    type: "actions",
    renderCell: RenderCellDelete,
  },
];

const PositionsUI = () => {
  const [state] = useAppState();
  const [rows, actions] = useUpdatedPositionRows(null);
  useMemo(() => {
    if (state.network.id) actions.load().then();
  }, [state.network, actions]);

  return (
    <div style={{ height: 500, width: "90%" }}>
      <DataGrid rows={rows} columns={columns} />
    </div>
  );
};
