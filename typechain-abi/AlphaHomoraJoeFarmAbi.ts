/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type BN from "bn.js";
import type { ContractOptions } from "web3-eth-contract";
import type { EventLog } from "web3-core";
import type { EventEmitter } from "events";
import type {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "./types";

export interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type ApprovalForAll = ContractEventLog<{
  account: string;
  operator: string;
  approved: boolean;
  0: string;
  1: string;
  2: boolean;
}>;
export type Recover = ContractEventLog<{
  token: string;
  amount: string;
  0: string;
  1: string;
}>;
export type RecoverETH = ContractEventLog<{
  amount: string;
  0: string;
}>;
export type SetGovernor = ContractEventLog<{
  governor: string;
  0: string;
}>;
export type SetPendingGovernor = ContractEventLog<{
  pendingGovernor: string;
  0: string;
}>;
export type TransferBatch = ContractEventLog<{
  operator: string;
  from: string;
  to: string;
  ids: string[];
  values: string[];
  0: string;
  1: string;
  2: string;
  3: string[];
  4: string[];
}>;
export type TransferSingle = ContractEventLog<{
  operator: string;
  from: string;
  to: string;
  id: string;
  value: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}>;
export type URI = ContractEventLog<{
  value: string;
  id: string;
  0: string;
  1: string;
}>;

export interface AlphaHomoraJoeFarmAbi extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): AlphaHomoraJoeFarmAbi;
  clone(): AlphaHomoraJoeFarmAbi;
  methods: {
    acceptGovernor(): NonPayableTransactionObject<void>;

    balanceOf(
      account: string,
      id: number | string | BN
    ): NonPayableTransactionObject<string>;

    balanceOfBatch(
      accounts: string[],
      ids: (number | string | BN)[]
    ): NonPayableTransactionObject<string[]>;

    burn(
      id: number | string | BN,
      amount: number | string | BN
    ): NonPayableTransactionObject<string>;

    chef(): NonPayableTransactionObject<string>;

    decodeId(id: number | string | BN): NonPayableTransactionObject<{
      pid: string;
      joePerShare: string;
      0: string;
      1: string;
    }>;

    encodeId(
      pid: number | string | BN,
      joePerShare: number | string | BN
    ): NonPayableTransactionObject<string>;

    getUnderlyingRate(
      arg0: number | string | BN
    ): NonPayableTransactionObject<string>;

    getUnderlyingToken(
      id: number | string | BN
    ): NonPayableTransactionObject<string>;

    governor(): NonPayableTransactionObject<string>;

    initialize(_chef: string): NonPayableTransactionObject<void>;

    isApprovedForAll(
      account: string,
      operator: string
    ): NonPayableTransactionObject<boolean>;

    joe(): NonPayableTransactionObject<string>;

    mint(
      pid: number | string | BN,
      amount: number | string | BN
    ): NonPayableTransactionObject<string>;

    pendingGovernor(): NonPayableTransactionObject<string>;

    recover(
      token: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    recoverETH(amount: number | string | BN): NonPayableTransactionObject<void>;

    safeBatchTransferFrom(
      from: string,
      to: string,
      ids: (number | string | BN)[],
      amounts: (number | string | BN)[],
      data: string | number[]
    ): NonPayableTransactionObject<void>;

    safeTransferFrom(
      from: string,
      to: string,
      id: number | string | BN,
      amount: number | string | BN,
      data: string | number[]
    ): NonPayableTransactionObject<void>;

    setApprovalForAll(
      operator: string,
      approved: boolean
    ): NonPayableTransactionObject<void>;

    setPendingGovernor(
      _pendingGovernor: string
    ): NonPayableTransactionObject<void>;

    supportsInterface(
      interfaceId: string | number[]
    ): NonPayableTransactionObject<boolean>;

    uri(arg0: number | string | BN): NonPayableTransactionObject<string>;
  };
  events: {
    ApprovalForAll(cb?: Callback<ApprovalForAll>): EventEmitter;
    ApprovalForAll(
      options?: EventOptions,
      cb?: Callback<ApprovalForAll>
    ): EventEmitter;

    Recover(cb?: Callback<Recover>): EventEmitter;
    Recover(options?: EventOptions, cb?: Callback<Recover>): EventEmitter;

    RecoverETH(cb?: Callback<RecoverETH>): EventEmitter;
    RecoverETH(options?: EventOptions, cb?: Callback<RecoverETH>): EventEmitter;

    SetGovernor(cb?: Callback<SetGovernor>): EventEmitter;
    SetGovernor(
      options?: EventOptions,
      cb?: Callback<SetGovernor>
    ): EventEmitter;

    SetPendingGovernor(cb?: Callback<SetPendingGovernor>): EventEmitter;
    SetPendingGovernor(
      options?: EventOptions,
      cb?: Callback<SetPendingGovernor>
    ): EventEmitter;

    TransferBatch(cb?: Callback<TransferBatch>): EventEmitter;
    TransferBatch(
      options?: EventOptions,
      cb?: Callback<TransferBatch>
    ): EventEmitter;

    TransferSingle(cb?: Callback<TransferSingle>): EventEmitter;
    TransferSingle(
      options?: EventOptions,
      cb?: Callback<TransferSingle>
    ): EventEmitter;

    URI(cb?: Callback<URI>): EventEmitter;
    URI(options?: EventOptions, cb?: Callback<URI>): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "ApprovalForAll", cb: Callback<ApprovalForAll>): void;
  once(
    event: "ApprovalForAll",
    options: EventOptions,
    cb: Callback<ApprovalForAll>
  ): void;

  once(event: "Recover", cb: Callback<Recover>): void;
  once(event: "Recover", options: EventOptions, cb: Callback<Recover>): void;

  once(event: "RecoverETH", cb: Callback<RecoverETH>): void;
  once(
    event: "RecoverETH",
    options: EventOptions,
    cb: Callback<RecoverETH>
  ): void;

  once(event: "SetGovernor", cb: Callback<SetGovernor>): void;
  once(
    event: "SetGovernor",
    options: EventOptions,
    cb: Callback<SetGovernor>
  ): void;

  once(event: "SetPendingGovernor", cb: Callback<SetPendingGovernor>): void;
  once(
    event: "SetPendingGovernor",
    options: EventOptions,
    cb: Callback<SetPendingGovernor>
  ): void;

  once(event: "TransferBatch", cb: Callback<TransferBatch>): void;
  once(
    event: "TransferBatch",
    options: EventOptions,
    cb: Callback<TransferBatch>
  ): void;

  once(event: "TransferSingle", cb: Callback<TransferSingle>): void;
  once(
    event: "TransferSingle",
    options: EventOptions,
    cb: Callback<TransferSingle>
  ): void;

  once(event: "URI", cb: Callback<URI>): void;
  once(event: "URI", options: EventOptions, cb: Callback<URI>): void;
}