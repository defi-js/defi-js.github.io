import React, { useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppState } from "../state/AppState";
import { useWalletsBalancesRows } from "../state/WalletsState";
import { useAllPositionsReady } from "../state/AllPositionsState";

const columns: GridColDef[] = [
  { field: "wallet", headerName: "Wallet", width: 240, align: "right" },
  { field: "network", headerName: "Network", width: 80, align: "left" },
  { field: "asset", headerName: "Asset", width: 80, align: "left" },
  { field: "value", headerName: "Market Value", width: 100, align: "right" },
  { field: "amount", headerName: "Amount", width: 100, align: "right" },
];

export const AllBalancesTable = () => {
  const [appState, appActions] = useAppState();
  const [isready] = useAllPositionsReady();
  const [rows, actions] = useWalletsBalancesRows();

  useEffect(() => {
    if (appState.network.id && isready) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions, isready]);

  const click = (p: any) => {};

  return (
    <div hidden={!rows.length || !isready} style={{ height: "100%", minHeight: 300, width: "90%" }}>
      <DataGrid rows={rows} columns={columns} onCellClick={click} />
    </div>
  );
};
