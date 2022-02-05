import React, { useEffect, useMemo } from "react";
import { useAllPositionRows, useAllPositions } from "../state/AllPositionsState";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppState } from "../state/AppState";
import { usePositionDialogActions } from "../state/PositionDialogState";
import { commafy } from "@defi.org/web3-candies";
import { Threat } from "../positions/base/Position";
import _ from "lodash";
import { ListItem, ListItemText } from "@mui/material";
import { AddPositionBtn } from "./AddPositionDialog";

const columns: GridColDef[] = [
  { field: "chain", headerName: "Chain", width: 120, align: "left" },
  { field: "name", headerName: "Position", width: 300, align: "left" },
  {
    field: "health",
    headerName: "Health",
    width: 100,
    align: "center",
    headerAlign: "center",
    valueFormatter: (v) => {
      const value = v.value as Threat[];
      if (!value.length) return "🟢";
      return value.map((t) => t.message).join("⚠️");
    },
  },
  {
    field: "value",
    headerName: "Market Value",
    width: 100,
    align: "right",
    type: "number",
    headerAlign: "center",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
  },
  {
    field: "pending",
    headerName: "Pending",
    width: 100,
    align: "right",
    type: "number",
    headerAlign: "center",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
  },
  {
    field: "tvl",
    headerName: "TVL",
    width: 120,
    align: "right",
    type: "number",
    headerAlign: "center",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
  },
  { field: "address", headerName: "Address", width: 450, align: "left", headerAlign: "center" },
];

export const AllPositionsTable = () => {
  const [appState, appActions] = useAppState();
  const [rows, actions] = useAllPositionRows(null);
  const [positions] = useAllPositions();
  const [, positionDialogActions] = usePositionDialogActions();

  useEffect(() => {
    if (appState.network?.id) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions]);

  const click = (p: any) => positionDialogActions.showPosition(positions[p.id.toString()]);

  const total = useMemo(() => commafy(_.reduce(rows, (sum, row) => sum + row.value, 0).toFixed(0)), [rows]);

  return (
    <div style={{ height: "100%", width: "90%" }}>
      <DataGrid rows={rows} columns={columns} onCellClick={click} autoHeight hideFooter />

      <ListItem>
        <ListItemText>Total Market Value: $ {total}</ListItemText>
      </ListItem>

      <AddPositionBtn />
    </div>
  );
};
