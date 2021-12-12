import React, { useEffect, useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppState } from "../state/AppState";
import { useWalletsBalancesRows } from "../state/WalletsState";
import { useAllPositionsReady } from "../state/AllPositionsState";
import { commafy } from "@defi.org/web3-candies";
import _ from "lodash";
import { ListItem, ListItemText } from "@mui/material";

const columns: GridColDef[] = [
  { field: "wallet", headerName: "Wallet", width: 450, align: "left" },
  { field: "network", headerName: "Network", width: 80, align: "left", headerAlign: "center" },
  { field: "asset", headerName: "Asset", width: 150, align: "left", headerAlign: "center" },
  {
    field: "value",
    headerName: "Market Value",
    width: 100,
    align: "right",
    type: "number",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
    headerAlign: "center",
  },
  {
    field: "amount",
    headerName: "Amount",
    width: 100,
    align: "right",
    type: "number",
    valueFormatter: (v) => commafy(_.toString(v.value)),
    sortable: true,
    headerAlign: "center",
  },
];

export const AllBalancesTable = () => {
  const [appState, appActions] = useAppState();
  const [isready] = useAllPositionsReady();
  const [rows, actions] = useWalletsBalancesRows(null);

  useEffect(() => {
    if (appState.network.id && isready) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions, isready]);

  const click = (p: any) => {};

  const total = useMemo(() => commafy(_.reduce(rows, (sum, row) => sum + row.value, 0).toFixed(0)), [rows]);

  return (
    <div hidden={!rows.length || !isready} style={{ height: "100%", width: "90%" }}>
      <DataGrid rows={rows} columns={columns} onCellClick={click} autoHeight hideFooter />

      <ListItem>
        <ListItemText>Total Wallets Market Value: $ {total}</ListItemText>
      </ListItem>
    </div>
  );
};
