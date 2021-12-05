import { PositionFactory } from "./base/PositionFactory";
import { erc20s } from "@defi.org/web3-candies";
import { Pancakeswap } from "./Pancakeswap";
import { Loops } from "./Loops";
import { ElrondMaiar } from "./ElrondMaiar";

export function registerAllPositions() {
  PositionFactory.register({
    "bsc:Pancakeswap:Farm:BUSD/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.BUSD(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_BUSD_BNB(), 252),
    "bsc:Pancakeswap:Farm:CAKE/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.CAKE(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_CAKE_BNB(), 251),
    "bsc:Pancakeswap:Farm:ORBS/BUSD": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.ORBS(), erc20s.bsc.BUSD(), erc20s.bsc.Pancakeswap_LP_ORBS_BUSD(), 416),

    "eth:Loops:AaveLoop": (args, oracle) => new Loops.AaveLoop(args, oracle),
    "eth:Loops:CompoundLoop": (args, oracle) => new Loops.CompoundLoop(args, oracle),

    "egld:Maiar:Farm:USDC/EGLD": (args, oracle) => new ElrondMaiar.Farm(args, oracle, ElrondMaiar.Strategies.USDC_EGLD()),
    "egld:Maiar:Farm:MEX/EGLD": (args, oracle) => new ElrondMaiar.Farm(args, oracle, ElrondMaiar.Strategies.MEX_EGLD()),
    // "egld:Maiar:Farm:MEX": (args, oracle) => new ElrondMaiar.Farm(args, oracle, [ElrondMaiar.tokens.MEX()]),
  });
}
