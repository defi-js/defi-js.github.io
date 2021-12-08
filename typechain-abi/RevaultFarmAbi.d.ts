/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { ContractOptions } from "web3-eth-contract";
import { EventLog } from "web3-core";
import { EventEmitter } from "events";
import {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "./types";

interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type OwnershipTransferred = ContractEventLog<{
  previousOwner: string;
  newOwner: string;
  0: string;
  1: string;
}>;
export type SetAdmin = ContractEventLog<{
  admin: string;
  0: string;
}>;
export type SetProfitToReva = ContractEventLog<{
  profitToReva: string;
  0: string;
}>;
export type SetProfitToRevaStakers = ContractEventLog<{
  profitToRevaStakers: string;
  0: string;
}>;
export type SetZapAndDeposit = ContractEventLog<{
  zapAndDepositAddress: string;
  0: string;
}>;

export interface RevaultFarmAbi extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): RevaultFarmAbi;
  clone(): RevaultFarmAbi;
  methods: {
    MAX_PROFIT_TO_REVA(): NonPayableTransactionObject<string>;

    MAX_PROFIT_TO_REVA_STAKERS(): NonPayableTransactionObject<string>;

    PROFIT_DISTRIBUTION_PRECISION(): NonPayableTransactionObject<string>;

    addVault(
      _vaultAddress: string,
      _depositTokenAddress: string,
      _nativeTokenAddress: string
    ): NonPayableTransactionObject<void>;

    admin(): NonPayableTransactionObject<string>;

    approvedDepositPayloads(
      arg0: number | string | BN,
      arg1: string | number[]
    ): NonPayableTransactionObject<boolean>;

    approvedHarvestPayloads(
      arg0: number | string | BN,
      arg1: string | number[]
    ): NonPayableTransactionObject<boolean>;

    approvedWithdrawPayloads(
      arg0: number | string | BN,
      arg1: string | number[]
    ): NonPayableTransactionObject<boolean>;

    depositToVault(
      _amount: number | string | BN,
      _vid: number | string | BN,
      _depositPayload: string | number[]
    ): PayableTransactionObject<void>;

    depositToVaultFor(
      _amount: number | string | BN,
      _vid: number | string | BN,
      _depositPayload: string | number[],
      _user: string
    ): PayableTransactionObject<void>;

    getUserVaultPrincipal(
      _vid: number | string | BN,
      _user: string
    ): NonPayableTransactionObject<string>;

    harvestVault(
      _vid: number | string | BN,
      _payloadHarvest: string | number[]
    ): NonPayableTransactionObject<{
      returnedTokenAmount: string;
      returnedRevaAmount: string;
      0: string;
      1: string;
    }>;

    haveApprovedTokenToZap(arg0: string): NonPayableTransactionObject<boolean>;

    initialize(
      _revaChefAddress: string,
      _revaTokenAddress: string,
      _revaUserProxyFactoryAddress: string,
      _revaFeeReceiver: string,
      _zap: string,
      _profitToReva: number | string | BN,
      _profitToRevaStakers: number | string | BN
    ): NonPayableTransactionObject<void>;

    owner(): NonPayableTransactionObject<string>;

    profitToReva(): NonPayableTransactionObject<string>;

    profitToRevaStakers(): NonPayableTransactionObject<string>;

    rebalanceDepositAll(
      _fromVid: number | string | BN,
      _toVid: number | string | BN,
      _withdrawPayload: string | number[],
      _depositAllPayload: string | number[]
    ): NonPayableTransactionObject<void>;

    rebalanceDepositAllAsWBNB(
      _fromVid: number | string | BN,
      _toVid: number | string | BN,
      _withdrawPayload: string | number[],
      _depositAllPayload: string | number[]
    ): NonPayableTransactionObject<void>;

    rebalanceDepositAllDynamicAmount(
      _fromVid: number | string | BN,
      _toVid: number | string | BN,
      _withdrawPayload: string | number[],
      _depositLeftPayload: string | number[],
      _depositRightPayload: string | number[]
    ): NonPayableTransactionObject<void>;

    renounceOwnership(): NonPayableTransactionObject<void>;

    revaChef(): NonPayableTransactionObject<string>;

    revaFeeReceiver(): NonPayableTransactionObject<string>;

    revaUserProxyFactory(): NonPayableTransactionObject<string>;

    setAdmin(_admin: string): NonPayableTransactionObject<void>;

    setDepositMethod(
      _vid: number | string | BN,
      _methodSig: string | number[],
      _approved: boolean
    ): NonPayableTransactionObject<void>;

    setHarvestMethod(
      _vid: number | string | BN,
      _methodSig: string | number[],
      _approved: boolean
    ): NonPayableTransactionObject<void>;

    setProfitToReva(
      _profitToReva: number | string | BN
    ): NonPayableTransactionObject<void>;

    setProfitToRevaStakers(
      _profitToRevaStakers: number | string | BN
    ): NonPayableTransactionObject<void>;

    setWithdrawMethod(
      _vid: number | string | BN,
      _methodSig: string | number[],
      _approved: boolean
    ): NonPayableTransactionObject<void>;

    setZapAndDeposit(_zapAndDeposit: string): NonPayableTransactionObject<void>;

    transferOwnership(newOwner: string): NonPayableTransactionObject<void>;

    userProxyContractAddress(arg0: string): NonPayableTransactionObject<string>;

    userVaultPrincipal(
      arg0: number | string | BN,
      arg1: string
    ): NonPayableTransactionObject<string>;

    vaultExists(arg0: string | number[]): NonPayableTransactionObject<boolean>;

    vaultLength(): NonPayableTransactionObject<string>;

    vaults(arg0: number | string | BN): NonPayableTransactionObject<{
      vaultAddress: string;
      depositTokenAddress: string;
      nativeTokenAddress: string;
      0: string;
      1: string;
      2: string;
    }>;

    withdrawFromVault(
      _vid: number | string | BN,
      _withdrawPayload: string | number[]
    ): NonPayableTransactionObject<{
      returnedTokenAmount: string;
      returnedRevaAmount: string;
      0: string;
      1: string;
    }>;

    withdrawFromVaultAndClaim(
      _vid: number | string | BN,
      _withdrawPayload: string | number[]
    ): NonPayableTransactionObject<void>;

    withdrawToken(
      tokenToWithdraw: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    zap(): NonPayableTransactionObject<string>;

    zapAndDeposit(): NonPayableTransactionObject<string>;
  };
  events: {
    OwnershipTransferred(cb?: Callback<OwnershipTransferred>): EventEmitter;
    OwnershipTransferred(
      options?: EventOptions,
      cb?: Callback<OwnershipTransferred>
    ): EventEmitter;

    SetAdmin(cb?: Callback<SetAdmin>): EventEmitter;
    SetAdmin(options?: EventOptions, cb?: Callback<SetAdmin>): EventEmitter;

    SetProfitToReva(cb?: Callback<SetProfitToReva>): EventEmitter;
    SetProfitToReva(
      options?: EventOptions,
      cb?: Callback<SetProfitToReva>
    ): EventEmitter;

    SetProfitToRevaStakers(cb?: Callback<SetProfitToRevaStakers>): EventEmitter;
    SetProfitToRevaStakers(
      options?: EventOptions,
      cb?: Callback<SetProfitToRevaStakers>
    ): EventEmitter;

    SetZapAndDeposit(cb?: Callback<SetZapAndDeposit>): EventEmitter;
    SetZapAndDeposit(
      options?: EventOptions,
      cb?: Callback<SetZapAndDeposit>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "OwnershipTransferred", cb: Callback<OwnershipTransferred>): void;
  once(
    event: "OwnershipTransferred",
    options: EventOptions,
    cb: Callback<OwnershipTransferred>
  ): void;

  once(event: "SetAdmin", cb: Callback<SetAdmin>): void;
  once(event: "SetAdmin", options: EventOptions, cb: Callback<SetAdmin>): void;

  once(event: "SetProfitToReva", cb: Callback<SetProfitToReva>): void;
  once(
    event: "SetProfitToReva",
    options: EventOptions,
    cb: Callback<SetProfitToReva>
  ): void;

  once(
    event: "SetProfitToRevaStakers",
    cb: Callback<SetProfitToRevaStakers>
  ): void;
  once(
    event: "SetProfitToRevaStakers",
    options: EventOptions,
    cb: Callback<SetProfitToRevaStakers>
  ): void;

  once(event: "SetZapAndDeposit", cb: Callback<SetZapAndDeposit>): void;
  once(
    event: "SetZapAndDeposit",
    options: EventOptions,
    cb: Callback<SetZapAndDeposit>
  ): void;
}