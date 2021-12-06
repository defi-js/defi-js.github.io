import { PositionFactory } from "./base/PositionFactory";
import { erc20, erc20s } from "@defi.org/web3-candies";
import { Pancakeswap } from "./Pancakeswap";
import { Loops } from "./Loops";
import { ElrondMaiar } from "./ElrondMaiar";

export function registerAllPositions() {
  PositionFactory.register({
    "bsc:Pancakeswap:Farm:BUSD/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.BUSD(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_BUSD_BNB(), 252),
    "bsc:Pancakeswap:Farm:CAKE/BNB": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.CAKE(), erc20s.bsc.WBNB(), erc20s.bsc.Pancakeswap_LP_CAKE_BNB(), 251),
    "bsc:Pancakeswap:Farm:ORBS/BUSD": (args, oracle) => new Pancakeswap.Farm(args, oracle, erc20s.bsc.ORBS(), erc20s.bsc.BUSD(), erc20s.bsc.Pancakeswap_LP_ORBS_BUSD(), 416),
    "bsc:Pancakeswap:Farm:BTCB/BNB": (args, oracle) =>
      new Pancakeswap.Farm(args, oracle, erc20s.bsc.BTCB(), erc20s.bsc.WBNB(), erc20("PancakeLP:BTCB/BNB", "0x61EB789d75A95CAa3fF50ed7E47b96c132fEc082", Pancakeswap.LP_ABI), 262),
    "bsc:Pancakeswap:Farm:DOT/BNB": (args, oracle) =>
      new Pancakeswap.Farm(
        args,
        oracle,
        erc20("DOT", "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402"),
        erc20s.bsc.WBNB(),
        erc20("PancakeLP:DOT/BNB", "0xDd5bAd8f8b360d76d12FdA230F8BAF42fe0022CF", Pancakeswap.LP_ABI),
        255
      ),
    "bsc:Pancakeswap:Farm:ADA/BNB": (args, oracle) =>
      new Pancakeswap.Farm(
        args,
        oracle,
        erc20("ADA", "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47"),
        erc20s.bsc.WBNB(),
        erc20("PancakeLP:ADA/BNB", "0x28415ff2C35b65B9E5c7de82126b4015ab9d031F", Pancakeswap.LP_ABI),
        253
      ),
    "bsc:Pancakeswap:Farm:DOGE/BNB": (args, oracle) =>
      new Pancakeswap.Farm(
        args,
        oracle,
        erc20("DOGE", "0xbA2aE424d960c26247Dd6c32edC70B295c744C43"),
        erc20s.bsc.WBNB(),
        erc20("PancakeLP:DOGE/BNB", "0xac109C8025F272414fd9e2faA805a583708A017f", Pancakeswap.LP_ABI),
        376
      ),
    "bsc:Pancakeswap:Farm:LINK/BNB": (args, oracle) =>
      new Pancakeswap.Farm(
        args,
        oracle,
        erc20("LINK", "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD"),
        erc20s.bsc.WBNB(),
        erc20("PancakeLP:LINK/BNB", "0x824eb9faDFb377394430d2744fa7C42916DE3eCe", Pancakeswap.LP_ABI),
        257
      ),

    "eth:Loops:AaveLoop": (args, oracle) => new Loops.AaveLoop(args, oracle),
    "eth:Loops:CompoundLoop": (args, oracle) => new Loops.CompoundLoop(args, oracle),

    "egld:Maiar:Farm:USDC/EGLD": (args, oracle) => new ElrondMaiar.Farm(args, oracle, ElrondMaiar.Strategies.USDC_EGLD()),
    "egld:Maiar:Farm:MEX/EGLD": (args, oracle) => new ElrondMaiar.Farm(args, oracle, ElrondMaiar.Strategies.MEX_EGLD()),
    // "egld:Maiar:Farm:MEX": (args, oracle) => new ElrondMaiar.Farm(args, oracle, [ElrondMaiar.tokens.MEX()]),
  });
}
