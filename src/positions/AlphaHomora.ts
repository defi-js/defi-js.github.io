import { PositionFactory } from "./base/PositionFactory";
import { Position, PositionArgs } from "./base/Position";
import { PriceOracle } from "./base/PriceOracle";
import { erc20s, networks } from "./base/consts";
import { Abi, bn, contract, eqIgnoreCase, erc20, ether, parseEvents, Token, web3, zero } from "@defi.org/web3-candies";
import type { AlphaHomoraBankAbi } from "../../typechain-abi/AlphaHomoraBankAbi";
import { AlphaHomoraJoeFarmAbi } from "../../typechain-abi/AlphaHomoraJoeFarmAbi";
import _ from "lodash";

export namespace AlphaHomora {
  export function register() {
    PositionFactory.register({
      "avax:AlphaHomora:WETHe/AVAX": (args, oracle) => new LYF(args, oracle, erc20s.avax.WETHe(), erc20s.avax.WAVAX()),
    });
  }

  class LYF implements Position {
    baseToken = erc20s.avax.WAVAX();
    alphaHomoraBank = contract<AlphaHomoraBankAbi>(require("../abi/AlphaHomoraBankAbi.json"), "0x376d16C7dE138B01455a51dA79AD65806E9cd694");
    maxHistoryBlocks = {
      [networks.avax.id]: 10_000_000,
    };

    data = {
      id: 0,
      supply0: zero,
      supply1: zero,
      borrow0: zero,
      borrow1: zero,
      amount0: zero,
      amount1: zero,
      value0: zero,
      value1: zero,
      pending: zero,
      pendingValue: zero,
      tvl: zero,
      valueIfHodl: zero,
      ilAmount: zero,
      il: zero,
      debtRatio: zero,
    };

    constructor(public args: PositionArgs, public oracle: PriceOracle, public token0: Token, public token1: Token) {
      this.data.id = parseInt(args.input!);
      if (!this.data.id) throw new Error("invalid input positionId");
    }

    getName = () => "";
    getNetwork = () => networks.avax;
    getArgs = () => this.args;
    getData = () => this.data;
    getTVL = () => this.data.tvl;
    getAssets = () => [this.token0, this.token1];
    getAmounts = () => [
      { asset: this.token0, amount: this.data.amount0, value: this.data.value0 },
      { asset: this.token1, amount: this.data.amount1, value: this.data.value1 },
    ];
    getRewardAssets = () => []; // TODO
    getPendingRewards = () => []; // TODO
    getHealth = () => []; // TODO

    async load() {
      const pos = await this.alphaHomoraBank.methods.getPositionInfo(this.data.id).call();
      const lpSupplied = bn(pos.collateralSize);
      const nft = contract<AlphaHomoraJoeFarmAbi>(require("../abi/AlphaHomoraJoeFarmAbi.json"), pos.collToken);
      const lpToken = erc20("", await nft.methods.getUnderlyingToken(pos.collId).call());
      const totalLPs = await lpToken.methods.totalSupply().call().then(bn);
      const share = lpSupplied.mul(ether).div(totalLPs);
      const total0 = await this.token0.methods.balanceOf(lpToken.address).call().then(bn);
      const total1 = await this.token1.methods.balanceOf(lpToken.address).call().then(bn);
      this.data.supply0 = total0.mul(share).div(ether);
      this.data.supply1 = total1.mul(share).div(ether);

      const debts = await this.alphaHomoraBank.methods.getPositionDebts(this.data.id).call();
      this.data.borrow0 = bn(debts.debts[_.indexOf(debts.tokens, this.token0.address)]);
      this.data.borrow1 = bn(debts.debts[_.indexOf(debts.tokens, this.token1.address)]);

      this.data.amount0 = this.data.supply0.sub(this.data.borrow0);
      this.data.amount1 = this.data.supply1.sub(this.data.borrow1);
      this.data.value0 = await this.oracle.valueOf(this.getNetwork().id, this.token0, this.data.amount0);
      this.data.value1 = await this.oracle.valueOf(this.getNetwork().id, this.token1, this.data.amount1);

      await this.loadDeposits();

      await this.loadDebtRatio();
    }

    private async loadDeposits() {
      const depositAbi = _(this.alphaHomoraBank.options.jsonInterface).find((x) => x.type === "function" && x.name === "execute")!;
      const depositSig = web3().eth.abi.encodeFunctionSignature(depositAbi);

      const currentBlock = await web3().eth.getBlockNumber();
      const earliestBlock = currentBlock - this.maxHistoryBlocks[this.getNetwork().id];

      const apiKey = ""; // TODO
      const alltxsResponse = await fetch(`https://api.snowtrace.io/api?module=account&action=txlist
&fromBlock=${earliestBlock}
&toBlock=${currentBlock}
&address=${this.args.address}
&sort=asc&apikey=${apiKey}`);
      const alltxs = await alltxsResponse.json();
      const relevantTxs = _.filter(alltxs.result, (tx) => eqIgnoreCase(tx.to, this.alphaHomoraBank.options.address) && tx.input.startsWith(depositSig));
      if (relevantTxs.length !== 1) {
        console.error("no / too many deposits");
        return;
      }
      const deposit = relevantTxs[0];
      const receipt = await web3().eth.getTransactionReceipt(deposit.hash);
      const events = parseEvents(receipt, this.token0);

      const depositEvent = events.find((e) => e.event === "Transfer" && eqIgnoreCase(e.address, this.token0.address) && eqIgnoreCase(e.returnValues.from, this.args.address))!;
      const deposit0 = bn(depositEvent.returnValues.value);
      const deposit1 = _.reduce(relevantTxs, (sum, tx) => sum.add(bn(tx.value)), zero);
      const valueNow0 = await this.oracle.valueOf(this.getNetwork().id, this.token0, deposit0);
      const valueNow1 = await this.oracle.valueOf(this.getNetwork().id, this.token1, deposit1);

      this.data.valueIfHodl = valueNow0.add(valueNow1);
      const valueNow = this.data.value0.add(this.data.value1);
      this.data.ilAmount = this.data.valueIfHodl.sub(valueNow);
      this.data.il = ether.sub(valueNow.mul(ether).div(this.data.valueIfHodl));
    }

    private async loadDebtRatio() {
      /*
        struct TokenFactors {
      uint16 borrowFactor; // The borrow factor for this token, multiplied by 1e4.
      uint16 collateralFactor; // The collateral factor for this token, multiplied by 1e4.
      uint16 liqIncentive; // The liquidation incentive, multiplied by 1e4.
      mapping(address => TokenFactors) public tokenFactors; // Mapping from token address to oracle info.
  }
         */

      /*
        struct TokenFactors {
    uint16 borrowFactor; // The borrow factor for this token, multiplied by 1e4.
    uint16 collateralFactor; // The collateral factor for this token, multiplied by 1e4.
    uint16 liqIncentive; // The liquidation incentive, multiplied by 1e4.
  }
  
  IBaseOracle public immutable source; // Main oracle source
  mapping(address => TokenFactors) public tokenFactors; // Mapping from token address to oracle info.
  mapping(address => bool) public whitelistERC1155; // Mapping from token address to whitelist status
       */
      const proxyOracleAbi: Abi = [
        {
          name: "tokenFactors",
          type: "function",
          stateMutability: "view",
          inputs: [
            {
              internalType: "address",
              name: "token",
              type: "address",
            },
          ],
          outputs: [
            {
              internalType: "uint256",
              name: "borrowFactor",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "collateralFactor",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "liqIncentive",
              type: "uint256",
            },
          ],
        },
      ];
      const o = contract(proxyOracleAbi, await this.alphaHomoraBank.methods.oracle().call());
      const f0 = bn((await o.methods.tokenFactors(this.token0.address).call()).borrowFactor).toNumber() / 1e4;
      const f1 = bn((await o.methods.tokenFactors(this.token1.address).call()).borrowFactor).toNumber() / 1e4;
      console.log(f0, f1);
    }

    getContractMethods = () => [];
    async callContract(method: string, args: string[]) {}
    async sendTransaction(method: string, args: string[], useLegacyTx: boolean) {}
    async harvest(useLegacyTx: boolean) {}
  }
}
