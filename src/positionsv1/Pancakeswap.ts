import { PositionArgs, PositionV1 } from "./base/PositionV1";
import { bn, contract, erc20, erc20s, Token, zero } from "@defi.org/web3-candies";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";
import { PancakeswapLpAbi, PancakeswapMasterchefV2Abi } from "../../typechain-abi";
import _ from "lodash";

export namespace Pancakeswap {
  // https://docs.pancakeswap.finance/code/migration/masterchef-v2/list-of-farms

  export function register() {
    const lp_BUSD_BNB = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP BUSD/BNB", "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16", 0, require("../abi/PancakeswapLpAbi.json"));
    const lp_BTCB_BNB = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP BTCB/BNB", "0x61EB789d75A95CAa3fF50ed7E47b96c132fEc082", 0, require("../abi/PancakeswapLpAbi.json"));
    const lp_CAKE_BNB = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP CAKE/BNB", "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0", 0, require("../abi/PancakeswapLpAbi.json"));
    const lp_ORBS_BUSD = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP ORBS/BUSD", "0xB87b857670A44356f2b70337E0F218713D2378e8", 0, require("../abi/PancakeswapLpAbi.json"));
    const lp_ORBS_BNB = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP ORBS/BNB", "0xcD71C49f6e9283Af099faE404f7F38aB543B7ca1", 0, require("../abi/PancakeswapLpAbi.json"));
    const lp_DOGE_BNB = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP DOGE/BNB", "0xac109C8025F272414fd9e2faA805a583708A017f", 0, require("../abi/PancakeswapLpAbi.json"));
    const lp_TON_BTCB = () => erc20<PancakeswapLpAbi>("Pancakeswap: LP TON/BTCB", "0x1893da6b92660b85538f58217808685b80fb083e", 0, require("../abi/PancakeswapLpAbi.json"));

    PositionFactory.register({
      "bsc:Pancakeswap:Farm:BUSD/BNB": (args, oracle) => new Farm(args, oracle, erc20s.bsc.BUSD(), erc20s.bsc.WBNB(), lp_BUSD_BNB(), 3),
      "bsc:Pancakeswap:Farm:CAKE/BNB": (args, oracle) => new Farm(args, oracle, erc20s.bsc.CAKE(), erc20s.bsc.WBNB(), lp_CAKE_BNB(), 2),
      "bsc:Pancakeswap:Farm:BTCB/BNB": (args, oracle) => new Farm(args, oracle, erc20s.bsc.BTCB(), erc20s.bsc.WBNB(), lp_BTCB_BNB(), 11),
      "bsc:Pancakeswap:Farm:DOGE/BNB": (args, oracle) => new Farm(args, oracle, erc20("DOGE", "0xbA2aE424d960c26247Dd6c32edC70B295c744C43"), erc20s.bsc.WBNB(), lp_DOGE_BNB(), 37),

      "bsc:Pancakeswap:LP:ORBS/BUSD": (args, oracle) => new LP(args, oracle, erc20s.bsc.ORBS(), erc20s.bsc.BUSD(), lp_ORBS_BUSD()),
      "bsc:Pancakeswap:LP:ORBS/BNB": (args, oracle) => new LP(args, oracle, erc20s.bsc.ORBS(), erc20s.bsc.WBNB(), lp_ORBS_BNB()),
      "bsc:Pancakeswap:LP:TON/BTCB": (args, oracle) => new LP(args, oracle, erc20("TON", "0x76A797A59Ba2C17726896976B7B3747BfD1d220f"), erc20s.bsc.BTCB(), lp_TON_BTCB()),
    });
  }

  class Farm implements PositionV1 {
    masterchef = contract<PancakeswapMasterchefV2Abi>(require("../abi/PancakeswapMasterchefV2Abi.json"), "0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652");
    cake = erc20s.bsc.CAKE();

    data = {
      chef: this.masterchef.options.address,
      poolId: this.poolId,
      lp: this.lpToken.address,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(
      public args: PositionArgs,
      public oracle: PriceOracle,
      public asset0: Token,
      public asset1: Token,
      public lpToken: Token & PancakeswapLpAbi,
      public poolId: number
    ) {}

    getName = () => ``;

    getArgs = () => this.args;

    getNetwork = () => networks.bsc;

    getAssets = () => [this.asset0, this.asset1];

    getRewardAssets = () => [this.cake];

    getData = () => this.data;

    getHealth = () => [];

    getAmounts = () => [
      {
        asset: this.asset0,
        amount: this.data.amount0,
        value: this.data.value0,
      },
      {
        asset: this.asset1,
        amount: this.data.amount1,
        value: this.data.value1,
      },
    ];

    getPendingRewards = () => [
      {
        asset: this.cake,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      const [userInfo, reserves, token0, totalSupply, pending, lpStaked] = await Promise.all([
        this.masterchef.methods.userInfo(this.poolId, this.args.address).call(),
        this.lpToken.methods.getReserves().call(),
        this.lpToken.methods.token0().call(),
        this.lpToken.methods.totalSupply().call(),
        this.masterchef.methods.pendingCake(this.poolId, this.args.address).call().then(this.cake.mantissa),
        this.lpToken.methods.balanceOf(this.masterchef.options.address).call().then(this.lpToken.mantissa),
      ]);
      const { _reserve0, _reserve1 } = reserves;
      const r0 = token0.toLowerCase() === this.asset0.address.toLowerCase() ? _reserve0 : _reserve1;
      const r1 = r0 === _reserve0 ? _reserve1 : _reserve0;
      const amountLP = bn(userInfo.amount);
      this.data.rewardAmount = pending;

      this.data.amount0 = await this.asset0.mantissa(bn(r0).times(amountLP).div(bn(totalSupply)));
      this.data.amount1 = await this.asset1.mantissa(bn(r1).times(amountLP).div(bn(totalSupply)));

      [this.data.value0, this.data.value1, this.data.rewardValue, this.data.tvl] = await Promise.all([
        this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0),
        this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1),
        this.oracle.valueOf(this.getNetwork().id, this.cake, this.data.rewardAmount),
        this.oracle.valueOf(this.getNetwork().id, this.asset1, bn(r1).times(2).times(bn(lpStaked)).div(bn(totalSupply))),
      ]);
    }

    getContractMethods = () => _.functions(this.masterchef.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.masterchef.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[]) {
      const tx = (this.masterchef.methods as any)[method](...args);
      alert(`target:\n${this.masterchef.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, true);
    }

    async harvest() {
      await sendWithTxType(this.masterchef.methods.deposit(this.poolId, 0), true);
    }
  }

  class LP extends Farm {
    constructor(public args: PositionArgs, public oracle: PriceOracle, public asset0: Token, public asset1: Token, public lpToken: Token & PancakeswapLpAbi) {
      super(args, oracle, asset0, asset1, lpToken, -1);
    }

    async load() {
      const [total0, total1, totalSupply] = await Promise.all([
        this.asset0.methods.balanceOf(this.lpToken.address).call().then(this.asset0.mantissa),
        this.asset1.methods.balanceOf(this.lpToken.address).call().then(this.asset1.mantissa),
        this.lpToken.methods.totalSupply().call().then(this.lpToken.mantissa),
      ]);
      const amountLP = await this.lpToken.methods.balanceOf(this.args.address).call().then(this.lpToken.mantissa);
      this.data.amount0 = total0.times(amountLP).div(totalSupply);
      this.data.amount1 = total1.times(amountLP).div(totalSupply);

      let val0, val1;
      [this.data.value0, this.data.value1, val0, val1] = await Promise.all([
        this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0),
        this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1),
        this.oracle.valueOf(this.getNetwork().id, this.asset0, total0),
        this.oracle.valueOf(this.getNetwork().id, this.asset1, total1),
      ]);
      this.data.tvl = val0.plus(val1);
    }
  }
}
