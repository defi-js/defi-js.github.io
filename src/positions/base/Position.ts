import BN from "bn.js";
import { Network, Token } from "@defi.org/web3-candies";

export type PositionArgs = {
  type: string;
  id: string;
  address: string;
  user: string;
  args?: string[];
};

export interface Position {
  getArgs(): PositionArgs;
  getNetwork(): Network;
  getAssets(): Token[];
  getRewardAssets(): Token[];
  // /**
  //  * USD, 18 decimals
  //  */
  // getTVL(): Promise<BN>;

  // /**
  //  * Percent spot annual rate without compounding, 18 decimals (123% == 1.23*10^18).
  //  */
  // getAPR(): Promise<BN>;

  // getGovernance
  getHealth(): Promise<Threat[]>;
  getAmounts(): Promise<TokenAmount[]>;
  getPendingRewards(): Promise<TokenAmount[]>;

  claim(useLegacyTx: boolean): Promise<void>;
}

export interface TokenAmount {
  asset: Token;
  /**
   * ERC20 amount
   */
  amount: BN;
  /**
   * USD, 18 decimals
   */
  value: BN;
}

export enum Severity {
  Critical,
  High,
  Medium,
  Low,
}

export interface Threat {
  severity: Severity;
  message: string;
  info: any;
}
