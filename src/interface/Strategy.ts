import BN from "bn.js";
import { Token } from "@defi.org/web3-candies";

export interface Strategy {
  load(): Promise<void>;

  getName(): string;

  getChain(): { id: number; name: string };

  getAssets(): Token[];

  getRewardAssets(): Token[];

  getTVL(): BN;

  getAPY(): BN;
}
