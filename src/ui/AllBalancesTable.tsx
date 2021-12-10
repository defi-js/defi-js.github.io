import React, { useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppState } from "../state/AppState";
import { useWalletsRows } from "../state/WalletsState";

const columns: GridColDef[] = [
  { field: "address", headerName: "Address", width: 300, align: "left" },
  { field: "token", headerName: "Token", width: 60, align: "left" },
  { field: "amount", headerName: "Amount", width: 100, align: "right" },
  { field: "value", headerName: "Market Value", width: 100, align: "right" },
];

export const AllBalancesTable = () => {
  const [appState, appActions] = useAppState();
  const [rows, actions] = useWalletsRows();
  // const [, positionDialogActions] = usePositionDialogActions();

  useEffect(() => {
    if (appState.network.id) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions]);

  const click = (p: any) => {}; //positionDialogActions.showPosition(positions[p.id.toString()]);

  return (
    <div hidden={!rows.length} style={{ height: "100%", minHeight: 500, width: "90%" }}>
      {/*<DataGrid rows={rows} columns={columns} onCellClick={click} />*/}
    </div>
  );
};
