import { Strategy } from "./Strategy";
import { Threat } from "./Health";
import { TokenAmount } from "./TokenAmount";

export interface Position extends Strategy {
  /**
   * LTV, IL
   */
  getHealth(): Threat[];

  getAmounts(): TokenAmount[];

  getPendingRewards(): TokenAmount[];
}
