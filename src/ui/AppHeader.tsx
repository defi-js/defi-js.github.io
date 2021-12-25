import React from "react";
import { isNetworkDisabled, SUPPORTED_NETWORKS, useAppState } from "../state/AppState";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import _ from "lodash";

export const AppHeader = () => {
  const [state, actions] = useAppState();

  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around", margin: 24 }}>
      <ToggleButtonGroup value={state.network?.id} exclusive onChange={(p: any) => actions.clickNetwork(parseInt(p.target.value))}>
        {_.map(SUPPORTED_NETWORKS, (network) => (
          <ToggleButton value={network.id} key={network.shortname} style={{ textTransform: "none" }} disabled={isNetworkDisabled(network)}>
            {network.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
};
