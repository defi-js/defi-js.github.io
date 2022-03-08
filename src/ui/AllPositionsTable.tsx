import React, { useEffect } from "react";
import { useAllPositionRows, useAllPositions, useAllPositionsTotals } from "../state/AllPositionsState";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAppState } from "../state/AppState";
import { usePositionDialogActions } from "../state/PositionDialogState";
import { commafy } from "@defi.org/web3-candies";
import { Threat } from "../positions/base/Position";
import { ListItemText } from "@mui/material";
import { AddPositionBtn } from "./AddPositionDialog";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const columns: GridColDef[] = [
  { field: "loaded", headerName: "🌐", width: 20, align: "center", valueFormatter: (v) => (v.value ? "✅" : "❔") },
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
  const [totals] = useAllPositionsTotals(null);

  useEffect(() => {
    if (appState.network?.id) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions]);

  const click = (p: any) => positionDialogActions.showPosition(positions[p.id.toString()]);

  return (
    <div style={{ height: "100%", width: "90%" }}>
      <ListItemText>Total Market Value: $ {commafy(totals.grandtotal)}</ListItemText>
      <ListItemText>Value Per Chain:</ListItemText>
      <Pie
        data={{
          labels: totals.labels,
          datasets: [
            {
              borderWidth: 2,
              data: totals.values,
              backgroundColor: totals.values.map((t) => colorOf(t, totals.grandtotal)),
            },
          ],
        }}
        options={{ responsive: false, plugins: { legend: { display: false } } }}
        height="200"
      />
      <br />

      <DataGrid rows={rows} columns={columns} onCellClick={click} autoHeight hideFooter />

      <br />
      <AddPositionBtn />
    </div>
  );
};

function colorOf(num: number, total: number) {
  return bgColors[Math.round((num / total) * (bgColors.length - 1))];
}

const bgColors = ["#F1E0AC", "#98B4AA", "#74959A", "#495371"];
