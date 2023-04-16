import _ from "lodash";
import { Network, PositionArgs, PositionV1 } from "./base/PositionV1";
import { PriceOracle } from "./base/PriceOracle";
import { bn, bn9, contract, erc20, Token, zero } from "@defi.org/web3-candies";
import { PositionFactory } from "./base/PositionFactory";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import type { RibbonGaugeAbi, RibbonThetaVaultAbi } from "../../typechain-abi";

export namespace Ribbon {
  export function register() {
    PositionFactory.register({
      "eth:Ribbon:T-CC:ETH": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.WETH(), "0x25751853Eab4D0eB3652B5eB6ecB102A2789644B"),
      "eth:Ribbon:T-CC:stETH": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.WETH(), "0x53773E034d9784153471813dacAFF53dBBB78E8c"),
      "eth:Ribbon:T-CC:WBTC": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.WBTC(), "0x65a833afDc250D9d38f8CD9bC2B1E3132dB13B2F"),
      "eth:Ribbon:T-CSP:yvUSDC": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.USDC(), "0xCc323557c71C0D1D20a1861Dc69c06C5f3cC9624"),

      "avax:Ribbon:T-CC:AVAX": (args, oracle) => new ThetaVault(args, oracle, networks.avax, erc20s.avax.WAVAX(), "0x98d03125c62DaE2328D9d3cb32b7B969e6a87787"),
    });
  }

  const rewardTokens = {
    [networks.eth.id]: () => erc20("RBN", "0x6123B0049F904d730dB3C36a31167D9d4121fA6B"),
    [networks.avax.id]: () => erc20s.avax.WAVAX(),
  };

  class ThetaVault implements PositionV1 {
    rewardToken = rewardTokens[this.network.id]();
    vault = contract<RibbonThetaVaultAbi>(require("../abi/RibbonThetaVaultAbi.json"), this.vaultAddress);

    data = {
      vault: this.vaultAddress,
      amount: zero,
      value: zero,
      tvl: zero,
      strike: zero,
      pending: zero,
      pendingValue: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public asset: Token, public vaultAddress: string) {}

    getName = () => "";
    getNetwork = () => this.network;
    getArgs = () => this.args;
    getData = () => this.data;
    getTVL = () => this.data.tvl;
    getAssets = () => [this.asset];
    getAmounts = () => [{ asset: this.asset, amount: this.data.amount, value: this.data.value }];
    getRewardAssets = () => [this.rewardToken];
    getPendingRewards = () => [{ asset: this.rewardToken, amount: this.data.pending, value: this.data.pendingValue }];
    getHealth = () => [];

    async load() {
      const { amount, unredeemedShares } = await this.vault.methods.depositReceipts(this.args.address).call();
      this.data.amount = await this.asset.mantissa(bn(amount).plus(bn(unredeemedShares)));

      // farms only on ETH
      if (this.network.id === networks.eth.id) {
        const farm = contract<RibbonGaugeAbi>(require("../abi/RibbonGaugeAbi.json"), await this.vault.methods.liquidityGauge().call());
        const [fbalance, fratio] = await Promise.all([farm.methods.balanceOf(this.args.address).call().then(bn), this.vault.methods.pricePerShare().call().then(bn)]);
        const staked = await this.asset.mantissa(fbalance.times(fratio).div(await this.asset.amount(1)));
        this.data.amount = this.data.amount.plus(staked);

        this.data.pending = await farm.methods.claimable_tokens(this.args.address).call().then(bn);
        this.data.pendingValue = await this.oracle.valueOf(this.getNetwork().id, this.rewardToken, this.data.pending);
      }

      this.data.value = await this.oracle.valueOf(this.network.id, this.asset, this.data.amount);

      const total = await this.asset.mantissa(await this.vault.methods.totalBalance().call());
      this.data.tvl = await this.oracle.valueOf(this.network.id, this.asset, total);

      const currentOption = contract(require("../abi/RibbonOptionAbi.json"), await this.vault.methods.currentOption().call());
      this.data.strike = bn9(await currentOption.methods["strikePrice()"]().call()).times(10);
    }

    getContractMethods = () => _.functions(this.vault.methods);

    async callContract(method: string, args: string[]) {
      const tx = (this.vault.methods as any)[method](...args);
      return await tx.call({ from: this.args.address });
    }

    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {
      const tx = (this.vault.methods as any)[method](...args);
      alert(`target:\n${this.vault.options.address}\ndata:\n${tx.encodeABI()}`);
      await sendWithTxType(tx, useLegacyTx);
    }

    async harvest(useLegacyTx: boolean) {}
  }
}
