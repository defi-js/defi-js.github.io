import BN from "bn.js";
import { Token } from "./Token";
import { Network } from "./Network";

export interface Strategy {
  load(): Promise<void>;

  getName(): string;

  getNetwork(): Network;

  getAssets(): Token[];

  getRewardAssets(): Token[];

  getTVL(): BN;

  getAPY(): BN;
}
