import { Strategy } from "./Strategy";
import { Threat } from "./Health";
import { TokenAmount } from "./TokenAmount";

export interface Position extends Strategy {
  getHealth(): Threat[];

  getAmounts(): TokenAmount[];

  getPendingRewards(): TokenAmount[];
}
