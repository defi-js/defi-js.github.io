import React, { useEffect, useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppActions, useIsAppConnected } from "../state/AppState";
import { useWalletsBalancesRows } from "../state/WalletsState";
import { useAllPositionsReady } from "../state/AllPositionsState";
import { commafy } from "@defi.org/web3-candies";
import _ from "lodash";
import { ListItem, ListItemText } from "@mui/material";
import { AddWalletBtn } from "./AddWalletDialog";

const columns: GridColDef[] = [
  { field: "symbol", headerName: "Symbol", width: 150, align: "left" },
  { field: "asset", headerName: "Asset", width: 300, align: "left", headerAlign: "center" },
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

export const AllStocksTable = () => {
  const [connected] = useIsAppConnected();
  const [, appActions] = useAppActions();
  const [positionsReady] = useAllPositionsReady();
  const [rows, actions] = useWalletsBalancesRows(null);

  useEffect(() => {
    if (connected && positionsReady) appActions.withLoading(actions.load).then();
  }, [connected, appActions, actions, positionsReady]);

  const click = (p: any) => {};

  const total = useMemo(() => commafy(_.reduce(rows, (sum, row) => sum + row.value, 0).toFixed(0)), [rows]);

  return (
    <div hidden={!positionsReady} style={{ height: "100%", width: "90%" }}>
      <div hidden={!rows.length}>
        <DataGrid rows={rows} columns={columns} onCellClick={click} autoHeight hideFooter />

        <ListItem>
          <ListItemText>Total Wallets Market Value: $ {total}</ListItemText>
        </ListItem>
      </div>

      <AddWalletBtn />
    </div>
  );
};
