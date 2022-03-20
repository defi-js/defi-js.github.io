import React from "react";
import "./App.css";
import { Backdrop, CircularProgress, createTheme, ThemeProvider } from "@mui/material";
import { useIsLoading } from "./state/AppState";
import { AppHeader } from "./ui/AppHeader";
import { AllPositionsTable } from "./ui/AllPositionsTable";
import { AddPositionDialog } from "./ui/AddPositionDialog";
import { PositionDialog } from "./ui/PositionDialog";
import { AlertDialog } from "./ui/AlertDialog";
import { ImportExport } from "./ui/ImportExport";

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

        <p>Hello World</p>

        {/*<AllPositionsTable />*/}

        {/*<br />*/}
        {/*<br />*/}

        {/*<ImportExport />*/}

        {/*<br />*/}

        {/*<div>*/}
        {/*  <AddPositionDialog />*/}
        {/*  <PositionDialog />*/}
        {/*  <AlertDialog />*/}
        {/*</div>*/}

        {/*<div>*/}
        {/*  <Loading />*/}
        {/*</div>*/}
      </div>
    </ThemeProvider>
  );
};

const Loading = () => {
  const [loading] = useIsLoading();
  return (
    <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }} open={loading}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
