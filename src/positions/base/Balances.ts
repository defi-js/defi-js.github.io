import { ElrondMaiar } from "../ElrondMaiar";
import { PositionFactory } from "./PositionFactory";
import { TokenAmount } from "./Position";

export async function fetchBalances(wallet: string): Promise<Record<string, TokenAmount[]>> {
  if (wallet.startsWith("erd1")) {
    return { egld: await ElrondMaiar.balances(PositionFactory.oracle, wallet) };
  }

  return {};
}
