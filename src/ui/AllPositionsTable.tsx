import React, { useEffect } from "react";
import { useAllPositionRows, useAllPositions, useAllPositionsValuePerAssetClass, useAllPositionsValuePerChain, useAllPositionsValuePerPosition } from "../state/AllPositionsState";
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
  { field: "loaded", headerName: "🌐", headerAlign: "center", width: 20, align: "center", valueFormatter: (v) => (v.value ? "✅" : "❔") },
  { field: "chain", headerName: "Chain", headerAlign: "center", width: 120, align: "left" },
  { field: "name", headerName: "Position", headerAlign: "center", width: 300, align: "left" },
  {
    field: "health",
    headerName: "Health",
    headerAlign: "center",
    width: 100,
    align: "center",
    valueFormatter: (v) => {
      if (!v.value || !(v.value as Threat[]).length) return "🟢";
      return (v.value as Threat[]).map((t) => t.message).join("⚠️");
    },
  },
  {
    field: "marketValue",
    headerName: "Market Value",
    headerAlign: "center",
    width: 100,
    align: "right",
    type: "number",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
  },
  {
    field: "pending",
    headerName: "Pending",
    headerAlign: "center",
    width: 100,
    align: "right",
    type: "number",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
  },
  {
    field: "tvl",
    headerName: "TVL",
    headerAlign: "center",
    width: 120,
    align: "right",
    type: "number",
    valueFormatter: (v) => "$  " + commafy((v.value as number).toFixed(0)),
    sortable: true,
  },
  { field: "address", headerName: "Address", headerAlign: "center", width: 450, align: "left" },
];

export const AllPositionsTable = () => {
  const [appState, appActions] = useAppState();
  const [rows, actions] = useAllPositionRows(null);
  const [positions] = useAllPositions();
  const [, positionDialogActions] = usePositionDialogActions();
  const [totalValuesPerChain] = useAllPositionsValuePerChain(null);
  const [valuesPerPosition] = useAllPositionsValuePerPosition(null);
  const [valuesPerAssetClass] = useAllPositionsValuePerAssetClass(null);

  useEffect(() => {
    if (appState.network?.id) appActions.withLoading(actions.load).then();
  }, [appState.network, appActions, actions]);

  const click = (p: any) => positionDialogActions.showPosition(positions[p.id.toString()]);

  return (
    <div style={{ height: "100%", width: "90%" }}>
      <ListItemText>Total Market Value: $ {commafy(totalValuesPerChain.grandtotal)}</ListItemText>

      <div style={{ display: "flex" }}>
        <div>
          <ListItemText>Value Per Chain:</ListItemText>
          <Pie
            data={{
              labels: totalValuesPerChain.labels,
              datasets: [
                {
                  data: totalValuesPerChain.values,
                  backgroundColor: totalValuesPerChain.values.map((v, i) => colorOf(i)),
                },
              ],
            }}
            options={{ responsive: false, plugins: { legend: { display: false } } }}
            height="200"
          />
        </div>

        <div>
          <ListItemText>Value Per Position:</ListItemText>
          <Pie
            data={{
              labels: valuesPerPosition.labels,
              datasets: [
                {
                  data: valuesPerPosition.values,
                  backgroundColor: valuesPerPosition.values.map((v, i) => colorOf(i)),
                },
              ],
            }}
            options={{ responsive: false, plugins: { legend: { display: false } } }}
            height="200"
          />
        </div>

        <div>
          <ListItemText>Value Per Asset Class:</ListItemText>
          <Pie
            data={{
              labels: valuesPerAssetClass.labels,
              datasets: [
                {
                  data: valuesPerAssetClass.values,
                  backgroundColor: valuesPerAssetClass.values.map((v, i) => colorOf(i)),
                },
              ],
            }}
            options={{ responsive: false, plugins: { legend: { display: false } } }}
            height="200"
          />
        </div>
      </div>

      <br />

      <DataGrid rows={rows} columns={columns} onCellClick={click} autoHeight hideFooter />

      <br />
      <AddPositionBtn />
    </div>
  );
};

function colorOf(num: number) {
  return bgColors[num % bgColors.length];
}

const bgColors = [
  "#413d5e",
  "#495371",
  "#638c93",
  "#98B4AA",
  "#F1E0AC", //
];
