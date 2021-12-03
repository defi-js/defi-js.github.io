import React from "react";
import "./App.css";
import { Backdrop, CircularProgress, createTheme, ThemeProvider } from "@mui/material";
import { useAppState } from "./state/AppState";
import { AppHeader } from "./ui/AppHeader";
import { AllPositionsTable } from "./ui/AllPositionsTable";
import { AddPositionDialog } from "./ui/AddPositionDialog";
import { PositionDialog } from "./ui/PositionDialog";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="App">
        <AppHeader />

        <AllPositionsTable />

        <div>
          <AddPositionDialog />
          <PositionDialog />
        </div>

        <div>
          <Loading />
        </div>
      </div>
    </ThemeProvider>
  );
};

const Loading = () => {
  const [state] = useAppState();
  return (
    <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }} open={state.loading}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
