import { Pancakeswap } from "./Pancakeswap";
import { Loops } from "./Loops";
import { Revault } from "./Revault";
import { Unicly } from "./Unicly";
import { TokenBalances } from "./TokenBalances";
import { Uniswap } from "./Uniswap";
import { OffChain } from "./OffChain";
import { AlphaHomora } from "./AlphaHomora";
import { Balancer } from "./Balancer";
import { ElrondMaiar } from "./ElrondMaiar";
import { TraderJoe } from "./TraderJoe";
import { Ribbon } from "./Ribbon";
import { LooksRare } from "./LooksRare";
import { SushiSwap } from "./SushiSwap";
import { Fodl } from "./Fodl";
import { QuickSwap } from "./QuickSwap";
import { Pangolin } from "./Pangolin";
import { Rook } from "./Rook";
import { Aave } from "./Aave";
import { SpookySwap } from "./SpookySwap";

export function registerAllPositions() {
  OffChain.register();
  TokenBalances.register();

  Uniswap.register();
  SushiSwap.register();
  Pancakeswap.register();
  Revault.register();
  AlphaHomora.register();
  Balancer.register();
  ElrondMaiar.register();
  TraderJoe.register();
  Ribbon.register();
  LooksRare.register();
  Unicly.register();
  Fodl.register();
  Loops.register();
  QuickSwap.register();
  Pangolin.register();
  Rook.register();
  Aave.register();
  SpookySwap.register()
}
