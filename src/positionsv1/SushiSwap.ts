import _ from "lodash";
import { bn, Contract, contract, erc20, erc20s, Network, Token, zero } from "@defi.org/web3-candies";
import { PositionV1, PositionArgs } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { networks, sendWithTxType } from "./base/consts";
import { PositionFactory } from "./base/PositionFactory";
import { SushiswapMinichefAbi } from "../../typechain-abi/SushiswapMinichefAbi";

export namespace SushiSwap {
  export function register() {
    PositionFactory.register({
      "eth:SushiSwap:Farm:USDC/ETH": (args, oracle) => new Farm(args, oracle, networks.eth, erc20s.eth.USDC(), erc20s.eth.WETH(), 1),
      "poly:SushiSwap:Farm:ETH/MATIC": (args, oracle) => new Farm(args, oracle, networks.poly, erc20s.poly.WETH(), erc20s.poly.WMATIC(), 0),
    });
  }

  class Farm implements PositionV1 {
    masterchef = getFarmContract(this.network);
    reward = getRewardContract(this.network);

    data = {
      chef: this.masterchef.options.address,
      poolId: this.poolId,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      rewardAmount: zero,
      rewardValue: zero,
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public asset0: Token, public asset1: Token, public poolId: number) {}

    getName = () => ``;

    getArgs = () => this.args;

    getNetwork = () => this.network;

    getAssets = () => [this.asset0, this.asset1];

    getRewardAssets = () => [this.reward];

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
        asset: this.reward,
        amount: this.data.rewardAmount,
        value: this.data.rewardValue,
      },
    ];

    getTVL = () => this.data.tvl;

    async load() {
      const [poolInfo, userInfo, pending] = await Promise.all([
        this.masterchef.methods.poolInfo(this.poolId).call(),
        this.masterchef.methods.userInfo(this.poolId, this.args.address).call(),
        this.masterchef.methods.pendingSushi(this.poolId, this.args.address).call(),
      ]);
      const lpToken = erc20("LP", poolInfo.lpToken || (await this.masterchef.methods.lpToken(this.poolId).call()));
      const lpTotalSupply = await lpToken.methods.totalSupply().call().then(bn);
      const lpAmount = bn(userInfo.amount);
      const [total0, total1, lpStaked] = await Promise.all([
        this.asset0.methods
          .balanceOf(lpToken.options.address)
          .call()
          .then((x) => this.asset0.mantissa(x)),
        this.asset1.methods
          .balanceOf(lpToken.options.address)
          .call()
          .then((x) => this.asset1.mantissa(x)),
        lpToken.methods.balanceOf(this.masterchef.options.address).call().then(bn),
      ]);
      this.data.amount0 = total0.mul(lpAmount).div(lpTotalSupply);
      this.data.amount1 = total1.mul(lpAmount).div(lpTotalSupply);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.asset0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.asset1, this.data.amount1);
      this.data.tvl = (await this.oracle.valueOf(this.getNetwork().id, this.asset0, total0.mul(lpStaked).div(lpTotalSupply))).add(
        await this.oracle.valueOf(this.getNetwork().id, this.asset1, total1.mul(lpStaked).div(lpTotalSupply))
      );

      this.data.rewardAmount = await this.reward.mantissa(pending);
      this.data.rewardValue = await this.oracle.valueOf(this.getNetwork().id, this.reward, this.data.rewardAmount);
    }

    getContractMethods = () => _.functions(this.masterchef.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.masterchef.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.masterchef.methods as any)[method](...args);
      alert(`target:\n${this.masterchef.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {
      const tx = this.network.id === networks.poly.id ? this.masterchef.methods.deposit(this.poolId, 0, this.args.address) : this.masterchef.methods.deposit(this.poolId, 0);
      await sendWithTxType(tx, useLegacyTx);
    }
  }

  function getFarmContract(network: Network): Contract {
    switch (network.shortname) {
      case "poly":
        return contract<SushiswapMinichefAbi>(require("../abi/SushiswapMinichefAbi.json"), "0x0769fd68dFb93167989C6f7254cd0D766Fb2841F");
      case "eth":
      default:
        return contract(require("../abi/SushiswapMasterchefAbi.json"), "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd");
    }
  }

  function getRewardContract(network: Network) {
    switch (network.shortname) {
      case "poly":
        return erc20("SUSHI", "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a");
      case "eth":
      default:
        return erc20("SUSHI", "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2");
    }
  }
}
