import { PositionFactory } from "./base/PositionFactory";
import { erc20s } from "./consts";
import { Pancakeswap } from "./Pancakeswap";
import { Loops } from "./Loops";
import { ElrondMaiar } from "./ElrondMaiar";
import { Revault } from "./Revault";
import { Unicly } from "./Unicly";
import { Fodl } from "./Fodl";

export function registerAllPositions() {
  PositionFactory.register({
    "bsc:Pancakeswap:Farm:BUSD/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.BUSD(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_BUSD_BNB(), 252),
    "bsc:Pancakeswap:Farm:CAKE/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.CAKE(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_CAKE_BNB(), 251),
    "bsc:Pancakeswap:Farm:ORBS/BUSD": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.ORBS(), erc20s.bsc.BUSD(), erc20s.bsc.Pancakeswap_LP_ORBS_BUSD(), 416),
    "bsc:Pancakeswap:Farm:BTCB/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.BTCB(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_BTCB_BNB(), 262),
    "bsc:Pancakeswap:Farm:DOT/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.DOT(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_DOT_BNB(), 255),
    "bsc:Pancakeswap:Farm:ADA/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.ADA(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_ADA_BNB(), 253),
    "bsc:Pancakeswap:Farm:LINK/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.LINK(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_LINK_BNB(), 257),
    "bsc:Pancakeswap:Farm:DOGE/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.DOGE(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_DOGE_BNB(), 376),

    "bsc:Revault:SingleVault:CAKE": (args, oracle) => new Revault.SingleVault(args, oracle, erc20s.bsc.CAKE()),
    "bsc:Revault:SingleVault:BUSD": (args, oracle) => new Revault.SingleVault(args, oracle, erc20s.bsc.BUSD()),
    "bsc:Revault:SingleVault:BNB": (args, oracle) => new Revault.SingleVault(args, oracle, erc20s.bsc.WBNB()),
    "bsc:Revault:RevaStaking:x1": (args, oracle) => new Revault.RevaStake(args, oracle, 0),
    "bsc:Revault:RevaStaking:x2": (args, oracle) => new Revault.RevaStake(args, oracle, 1),
    "bsc:Revault:RevaStaking:x3": (args, oracle) => new Revault.RevaStake(args, oracle, 2),
    "bsc:Revault:RevaStaking:x4": (args, oracle) => new Revault.RevaStake(args, oracle, 3),

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
