import _ from "lodash";
import BN from "bn.js";
import { PositionFactory } from "./base/PositionFactory";
import { Position, PositionArgs } from "./base/Position";
import { bn, contract, eqIgnoreCase, erc20, Network, Token, zero } from "@defi.org/web3-candies";
import { PriceOracle } from "./base/PriceOracle";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import { BalancerV2VaultAbi } from "../../typechain-abi/BalancerV2VaultAbi";

export namespace Balancer {
  export function register() {
    PositionFactory.register({
      "poly:Balancer:USDC/DAI/MAI/USDT": (args, oracle) =>
        new Farm(
          args,
          oracle,
          networks.poly,
          [erc20s.poly.USDC(), erc20s.poly.DAI(), erc20("MAI", "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1"), erc20s.poly.USDT()],
          "0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000012"
        ),
    });
  }

  const balToken = {
    [networks.poly.id]: () => erc20("BAL", "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3"),
  };

  const balV2 = {
    [networks.poly.id]: () => contract<BalancerV2VaultAbi>(require("../abi/BalancerV2VaultAbi.json"), "0xBA12222222228d8Ba445958a75a0704d566BF2C8"),
  };

  class Farm implements Position {
    vault = balV2[this.network.id]();
    bal = balToken[this.network.id]();

    data = {
      amounts: [] as BN[],
      values: [] as BN[],
      tvl: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public tokens: Token[], public poolId: string) {}

    getName = () => "";
    getNetwork = () => this.network;
    getArgs = () => this.args;
    getData = () => this.data;
    getTVL = () => this.data.tvl;
    getAssets = () => this.tokens;
    getAmounts = () => _.map(this.tokens, (asset, i) => ({ asset, amount: this.data.amounts[i] || zero, value: this.data.values[i] || zero }));
    getRewardAssets = () => [this.bal];
    getPendingRewards = () => [];
    getHealth = () => [];

    async load() {
      const bpt = erc20(
        "BPT",
        await this.vault.methods
          .getPool(this.poolId)
          .call()
          .then((x) => x["0"])
      );
      const poolTokens = await this.vault.methods.getPoolTokens(this.poolId).call();
      if (!_.every(this.tokens, (t, i) => eqIgnoreCase(t.options.address, poolTokens.tokens[i]))) throw new Error(`invalid Balancer poolBalances`);
      const [bptBalance, bptTotalSupply] = await Promise.all([bpt.methods.balanceOf(this.args.address).call().then(bn), bpt.methods.totalSupply().call().then(bn)]);

      this.data.amounts = await Promise.all(_.map(this.tokens, (t, i) => t.mantissa(bn(poolTokens.balances[i]).mul(bptBalance).div(bptTotalSupply))));
      this.data.values = await Promise.all(_.map(this.tokens, (t, i) => this.oracle.valueOf(this.network.id, t, this.data.amounts[i])));

      const poolAmounts = await Promise.all(_.map(this.tokens, (t, i) => t.mantissa(bn(poolTokens.balances[i]))));
      const poolValues = await Promise.all(_.map(this.tokens, (t, i) => this.oracle.valueOf(this.network.id, t, poolAmounts[i])));
      this.data.tvl = poolValues.reduce((sum, b) => sum.add(bn(b)), zero);
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
