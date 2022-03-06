import _ from "lodash";
import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { bn, bn9, contract, Network, Token, zero } from "@defi.org/web3-candies";
import { PositionFactory } from "./base/PositionFactory";
import { erc20s, networks, sendWithTxType } from "./base/consts";
import type { RibbonThetaVaultAbi } from "../../typechain-abi/RibbonThetaVaultAbi";

export namespace Ribbon {
  export function register() {
    PositionFactory.register({
      "eth:Ribbon:T-CC:ETH": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.WETH(), "0x25751853Eab4D0eB3652B5eB6ecB102A2789644B"),
      "eth:Ribbon:T-CC:stETH": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.WETH(), "0x53773E034d9784153471813dacAFF53dBBB78E8c"),
      "eth:Ribbon:T-CC:WBTC": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.WBTC(), "0x65a833afDc250D9d38f8CD9bC2B1E3132dB13B2F"),
      "eth:Ribbon:T-CSP:yvUSDC": (args, oracle) => new ThetaVault(args, oracle, networks.eth, erc20s.eth.USDC(), "0xCc323557c71C0D1D20a1861Dc69c06C5f3cC9624"),
    });
  }

  class ThetaVault implements Position {
    vault = contract<RibbonThetaVaultAbi>(require("../abi/RibbonThetaVaultAbi.json"), this.vaultAddress);

    data = {
      amount: zero,
      value: zero,
      tvl: zero,
      strike: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public network: Network, public asset: Token, public vaultAddress: string) {}

    getName = () => "";
    getNetwork = () => this.network;
    getArgs = () => this.args;
    getData = () => this.data;
    getTVL = () => this.data.tvl;
    getAssets = () => [this.asset];
    getAmounts = () => [{ asset: this.asset, amount: this.data.amount, value: this.data.value }];
    getRewardAssets = () => [];
    getPendingRewards = () => [];
    getHealth = () => [];

    async load() {
      const { amount, unredeemedShares } = await this.vault.methods.depositReceipts(this.args.address).call();
      this.data.amount = await this.asset.mantissa(bn(amount).add(bn(unredeemedShares)));
      this.data.value = await this.oracle.valueOf(this.network.id, this.asset, this.data.amount);
      const total = await this.asset.mantissa(await this.vault.methods.totalBalance().call());
      this.data.tvl = await this.oracle.valueOf(this.network.id, this.asset, total);

      const currentOption = contract(
        [
          { inputs: [], name: "expiryTimestamp", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
          { inputs: [], name: "strikePrice", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
        ],
        await this.vault.methods.currentOption().call()
      );
      this.data.strike = bn9(await currentOption.methods["strikePrice()"]().call()).muln(10);
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
