import { PositionFactory } from "./base/PositionFactory";
import { Pancakeswap } from "./Pancakeswap";
import { Loops } from "./Loops";
import { ElrondMaiar } from "./ElrondMaiar";
import { Revault } from "./Revault";
import { Unicly } from "./Unicly";
import { Fodl } from "./Fodl";
import { TokenBalances } from "./TokenBalances";
import { Uniswap } from "./Uniswap";
import { OffChain } from "./OffChain";

export function registerAllPositions() {
  OffChain.register();
  TokenBalances.register();

  Uniswap.register();
  Pancakeswap.register();
  Revault.register();

  PositionFactory.register({
    "eth:Fodl:XFodlStake": (args, oracle) => new Fodl.XFodlStake(args, oracle),

    "eth:Unicly:XUnicFarm:uPunks": (args, oracle) => new Unicly.XUnicFarm(args, oracle, Unicly.Strategies.uPunks()),
    "eth:Unicly:XUnicFarm:uJenny": (args, oracle) => new Unicly.XUnicFarm(args, oracle, Unicly.Strategies.uJenny()),

    "eth:Loops:AaveLoop": (args, oracle) => new Loops.AaveLoop(args, oracle),
    "eth:Loops:CompoundLoop": (args, oracle) => new Loops.CompoundLoop(args, oracle),

    "egld:Maiar:Farm:USDC/EGLD": (args, oracle) => new ElrondMaiar.Farm(args, oracle, ElrondMaiar.FarmStrategies.USDC_EGLD()),
    "egld:Maiar:Farm:MEX/EGLD": (args, oracle) => new ElrondMaiar.Farm(args, oracle, ElrondMaiar.FarmStrategies.MEX_EGLD()),
    "egld:Maiar:MEXFarm:MEX": (args, oracle) => new ElrondMaiar.MexFarm(args, oracle, ElrondMaiar.MexFarmStrategies.MEX()),
    "egld:Maiar:MEXFarm:RIDE": (args, oracle) => new ElrondMaiar.MexFarm(args, oracle, ElrondMaiar.MexFarmStrategies.RIDE()),
  });
}
