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

export type Deposit = ContractEventLog<{
  user: string;
  pid: string;
  amount: string;
  to: string;
  0: string;
  1: string;
  2: string;
  3: string;
}>;
export type EmergencyWithdraw = ContractEventLog<{
  user: string;
  pid: string;
  amount: string;
  to: string;
  0: string;
  1: string;
  2: string;
  3: string;
}>;
export type Harvest = ContractEventLog<{
  user: string;
  pid: string;
  amount: string;
  0: string;
  1: string;
  2: string;
}>;
export type LogInit = ContractEventLog<{}>;
export type LogPoolAddition = ContractEventLog<{
  pid: string;
  allocPoint: string;
  lpToken: string;
  rewarder: string;
  update: boolean;
  0: string;
  1: string;
  2: string;
  3: string;
  4: boolean;
}>;
export type LogSetPool = ContractEventLog<{
  pid: string;
  allocPoint: string;
  rewarder: string;
  overwrite: boolean;
  update: boolean;
  0: string;
  1: string;
  2: string;
  3: boolean;
  4: boolean;
}>;
export type LogUpdatePool = ContractEventLog<{
  pid: string;
  lastRewardTime: string;
  lpSupply: string;
  accBooPerShare: string;
  0: string;
  1: string;
  2: string;
  3: string;
}>;
export type OwnershipTransferred = ContractEventLog<{
  previousOwner: string;
  newOwner: string;
  0: string;
  1: string;
}>;
export type Withdraw = ContractEventLog<{
  user: string;
  pid: string;
  amount: string;
  to: string;
  0: string;
  1: string;
  2: string;
  3: string;
}>;

export interface SpookyChefAbi extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): SpookyChefAbi;
  clone(): SpookyChefAbi;
  methods: {
    BOO(): NonPayableTransactionObject<string>;

    MASTER_CHEF(): NonPayableTransactionObject<string>;

    MASTER_PID(): NonPayableTransactionObject<string>;

    V1_HARVEST_QUERY_TIME(): NonPayableTransactionObject<string>;

    add(
      allocPoint: number | string | BN,
      _lpToken: string,
      _rewarder: string,
      update: boolean
    ): NonPayableTransactionObject<void>;

    booPerSecond(): NonPayableTransactionObject<string>;

    "deposit(uint256,uint256,address)"(
      pid: number | string | BN,
      amount: number | string | BN,
      to: string
    ): NonPayableTransactionObject<void>;

    "deposit(uint256,uint256)"(
      pid: number | string | BN,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    emergencyWithdraw(
      pid: number | string | BN,
      to: string
    ): NonPayableTransactionObject<void>;

    getFarmData(pid: number | string | BN): NonPayableTransactionObject<{
      0: [string, string, string];
      1: string;
      2: string;
    }>;

    harvestAll(): NonPayableTransactionObject<void>;

    harvestFromMasterChef(): NonPayableTransactionObject<void>;

    harvestMultiple(
      pids: (number | string | BN)[]
    ): NonPayableTransactionObject<void>;

    init(dummyToken: string): NonPayableTransactionObject<void>;

    isLpToken(arg0: string): NonPayableTransactionObject<boolean>;

    lastV1HarvestTimestamp(): NonPayableTransactionObject<string>;

    lpToken(arg0: number | string | BN): NonPayableTransactionObject<string>;

    massUpdateAllPools(): NonPayableTransactionObject<void>;

    massUpdatePools(
      pids: (number | string | BN)[]
    ): NonPayableTransactionObject<void>;

    owner(): NonPayableTransactionObject<string>;

    pendingBOO(
      _pid: number | string | BN,
      _user: string
    ): NonPayableTransactionObject<string>;

    poolInfo(arg0: number | string | BN): NonPayableTransactionObject<{
      accBooPerShare: string;
      lastRewardTime: string;
      allocPoint: string;
      0: string;
      1: string;
      2: string;
    }>;

    poolInfoAmount(): NonPayableTransactionObject<string>;

    poolLength(): NonPayableTransactionObject<string>;

    queryHarvestFromMasterChef(): NonPayableTransactionObject<void>;

    renounceOwnership(): NonPayableTransactionObject<void>;

    rewarder(arg0: number | string | BN): NonPayableTransactionObject<string>;

    set(
      _pid: number | string | BN,
      _allocPoint: number | string | BN,
      _rewarder: string,
      overwrite: boolean,
      update: boolean
    ): NonPayableTransactionObject<void>;

    setBatch(
      _pid: (number | string | BN)[],
      _allocPoint: (number | string | BN)[],
      _rewarders: string[],
      overwrite: boolean[],
      update: boolean
    ): NonPayableTransactionObject<void>;

    setV1HarvestQueryTime(
      newTime: number | string | BN,
      inDays: boolean
    ): NonPayableTransactionObject<void>;

    totalAllocPoint(): NonPayableTransactionObject<string>;

    transferOwnership(newOwner: string): NonPayableTransactionObject<void>;

    updatePool(
      pid: number | string | BN
    ): NonPayableTransactionObject<[string, string, string]>;

    userInfo(
      arg0: number | string | BN,
      arg1: string
    ): NonPayableTransactionObject<{
      amount: string;
      rewardDebt: string;
      0: string;
      1: string;
    }>;

    "withdraw(uint256,uint256,address)"(
      pid: number | string | BN,
      amount: number | string | BN,
      to: string
    ): NonPayableTransactionObject<void>;

    "withdraw(uint256,uint256)"(
      pid: number | string | BN,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;
  };
  events: {
    Deposit(cb?: Callback<Deposit>): EventEmitter;
    Deposit(options?: EventOptions, cb?: Callback<Deposit>): EventEmitter;

    EmergencyWithdraw(cb?: Callback<EmergencyWithdraw>): EventEmitter;
    EmergencyWithdraw(
      options?: EventOptions,
      cb?: Callback<EmergencyWithdraw>
    ): EventEmitter;

    Harvest(cb?: Callback<Harvest>): EventEmitter;
    Harvest(options?: EventOptions, cb?: Callback<Harvest>): EventEmitter;

    LogInit(cb?: Callback<LogInit>): EventEmitter;
    LogInit(options?: EventOptions, cb?: Callback<LogInit>): EventEmitter;

    LogPoolAddition(cb?: Callback<LogPoolAddition>): EventEmitter;
    LogPoolAddition(
      options?: EventOptions,
      cb?: Callback<LogPoolAddition>
    ): EventEmitter;

    LogSetPool(cb?: Callback<LogSetPool>): EventEmitter;
    LogSetPool(options?: EventOptions, cb?: Callback<LogSetPool>): EventEmitter;

    LogUpdatePool(cb?: Callback<LogUpdatePool>): EventEmitter;
    LogUpdatePool(
      options?: EventOptions,
      cb?: Callback<LogUpdatePool>
    ): EventEmitter;

    OwnershipTransferred(cb?: Callback<OwnershipTransferred>): EventEmitter;
    OwnershipTransferred(
      options?: EventOptions,
      cb?: Callback<OwnershipTransferred>
    ): EventEmitter;

    Withdraw(cb?: Callback<Withdraw>): EventEmitter;
    Withdraw(options?: EventOptions, cb?: Callback<Withdraw>): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "Deposit", cb: Callback<Deposit>): void;
  once(event: "Deposit", options: EventOptions, cb: Callback<Deposit>): void;

  once(event: "EmergencyWithdraw", cb: Callback<EmergencyWithdraw>): void;
  once(
    event: "EmergencyWithdraw",
    options: EventOptions,
    cb: Callback<EmergencyWithdraw>
  ): void;

  once(event: "Harvest", cb: Callback<Harvest>): void;
  once(event: "Harvest", options: EventOptions, cb: Callback<Harvest>): void;

  once(event: "LogInit", cb: Callback<LogInit>): void;
  once(event: "LogInit", options: EventOptions, cb: Callback<LogInit>): void;

  once(event: "LogPoolAddition", cb: Callback<LogPoolAddition>): void;
  once(
    event: "LogPoolAddition",
    options: EventOptions,
    cb: Callback<LogPoolAddition>
  ): void;

  once(event: "LogSetPool", cb: Callback<LogSetPool>): void;
  once(
    event: "LogSetPool",
    options: EventOptions,
    cb: Callback<LogSetPool>
  ): void;

  once(event: "LogUpdatePool", cb: Callback<LogUpdatePool>): void;
  once(
    event: "LogUpdatePool",
    options: EventOptions,
    cb: Callback<LogUpdatePool>
  ): void;

  once(event: "OwnershipTransferred", cb: Callback<OwnershipTransferred>): void;
  once(
    event: "OwnershipTransferred",
    options: EventOptions,
    cb: Callback<OwnershipTransferred>
  ): void;

  once(event: "Withdraw", cb: Callback<Withdraw>): void;
  once(event: "Withdraw", options: EventOptions, cb: Callback<Withdraw>): void;
}