import React from "react";

export type PositionUiProps = {
  owner: string;
  withLoading: (t: () => Promise<void>) => Promise<void>;
};
export abstract class PositionUi extends React.Component<PositionUiProps, any> {}
