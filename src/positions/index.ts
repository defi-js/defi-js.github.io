import { PositionFactory } from "./base/PositionFactory";
import { Pancakeswap } from "./Pancakeswap";
import { Loops } from "./Loops";
import { Revault } from "./Revault";
import { Unicly } from "./Unicly";
import { Fodl } from "./Fodl";
import { TokenBalances } from "./TokenBalances";
import { Uniswap } from "./Uniswap";
import { OffChain } from "./OffChain";
import { AlphaHomora } from "./AlphaHomora";
import { Balancer } from "./Balancer";
import { ElrondMaiar } from "./ElrondMaiar";
import { TraderJoe } from "./TraderJoe";

export function registerAllPositions() {
  OffChain.register();
  TokenBalances.register();

  Uniswap.register();
  Pancakeswap.register();
  Revault.register();
  AlphaHomora.register();
  Balancer.register();
  ElrondMaiar.register();
  TraderJoe.register();

  PositionFactory.register({
    "eth:Fodl:XFodlStake": (args, oracle) => new Fodl.XFodlStake(args, oracle),

    "eth:Unicly:XUnicFarm:uPunks": (args, oracle) => new Unicly.XUnicFarm(args, oracle, Unicly.Strategies.uPunks()),
    "eth:Unicly:XUnicFarm:uJenny": (args, oracle) => new Unicly.XUnicFarm(args, oracle, Unicly.Strategies.uJenny()),

    "eth:Loops:AaveLoop": (args, oracle) => new Loops.AaveLoop(args, oracle),
    "eth:Loops:CompoundLoop": (args, oracle) => new Loops.CompoundLoop(args, oracle),
  });
}
