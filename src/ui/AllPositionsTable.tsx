import React, { useEffect } from "react";
import { useAllPositionRows, useAllPositions } from "../state/AllPositionsState";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppState } from "../state/AppState";
import { usePositionDialogActions } from "../state/PositionDialogState";

const columns: GridColDef[] = [
  { field: "type", headerName: "Type", width: 300, align: "left" },
  { field: "health", headerName: "Health", width: 60, align: "center" },
  { field: "value", headerName: "Market Value", width: 100, align: "right" },
  { field: "pending", headerName: "Pending", width: 100, align: "right" },
  { field: "tvl", headerName: "TVL", width: 150, align: "right" },
];

export const AllPositionsTable = () => {
  const [appState, appActions] = useAppState();
  const [rows, actions] = useAllPositionRows(null);
  const [positions] = useAllPositions();
  const [, positionDialogActions] = usePositionDialogActions();

  useEffect(() => {
    if (appState.network.id) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions]);

  const click = (p: any) => positionDialogActions.showPosition(positions[p.id.toString()]);

  return (
    <div style={{ height: "100%", minHeight: 500, width: "90%" }}>
      <DataGrid rows={rows} columns={columns} onCellClick={click} />
    </div>
  );
};
