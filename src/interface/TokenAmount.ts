import BN from "bn.js";
import { Token } from "@defi.org/web3-candies";

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
