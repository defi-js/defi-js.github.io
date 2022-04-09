import React from "react";
import { Button, ButtonGroup } from "@mui/material";
import { loadPositionsFromStorage, savePositionsToStorage } from "../state/AllPositionsState";
import { PositionArgs } from "../positionsv1/base/PositionV1";

const downloadFile = (data: string, fileName: string, fileType: "text/json" | "text/csv") => {
  const blob = new Blob([data], { type: fileType });

  const a = document.createElement("a");
  a.download = fileName;
  a.href = window.URL.createObjectURL(blob);
  a.dispatchEvent(
    new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    })
  );
  a.remove();
};

const exportPositionsJson = (e: any) => {
  const data = JSON.stringify(loadPositionsFromStorage(), null, 2);
  const name = `Positions-V1-${new Date().toISOString().split("T")[0]}.json`;
  downloadFile(data, name, "text/json");
};

const importPositionsJson = (e: any) => {
  const a = document.createElement("input");
  a.type = "file";
  a.accept = "application/json";
  a.hidden = true;
  a.id = "inputJsonFile";
  a.dispatchEvent(
    new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    })
  );
  a.addEventListener("change", () => {
    const file = a.files![0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const str = e.target?.result?.toString();
      const data = JSON.parse(str || "{}") as Record<string, PositionArgs>;
      console.log("parsed", data);
      savePositionsToStorage(data);
      a.remove();
      window.location.reload();
    };
    reader.readAsText(file, "utf8");
  });
};

export const ImportExport = () => {
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}>
      <ButtonGroup variant="outlined" aria-label="outlined button group">
        <Button onClick={importPositionsJson}>Import JSON</Button>
        <Button onClick={exportPositionsJson}>Export JSON</Button>
      </ButtonGroup>
    </div>
  );
};
