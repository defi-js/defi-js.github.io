import { BN, Network, Token } from "@defi.org/web3-candies";

export type PositionArgs = {
  type: string;
  address: string;
  id: string;
  input?: string;
  name?: string;
};

export interface PositionV1 {
  getName(): string;
  getArgs(): PositionArgs;
  getNetwork(): Network;
  getAssets(): Token[];
  getRewardAssets(): Token[];

  // TODO getGovernance
  load(): Promise<void>;
  getData(): { [key: string]: BN | string | number | BN[] };

  getHealth(): Threat[];
  getAmounts(): TokenAmount[];
  getPendingRewards(): TokenAmount[];
  getTVL(): BN;
  // getAPR(): BN;

  getContractMethods(): string[];
  callContract(method: string, args: string[]): Promise<any>;
  sendTransaction(method: string, args: string[], useLegacyTx: boolean): Promise<void>;
  harvest(useLegacyTx: boolean): Promise<void>;
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
}
