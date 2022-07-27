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

export type Approval = ContractEventLog<{
  owner: string;
  spender: string;
  value: string;
  0: string;
  1: string;
  2: string;
}>;
export type AssetConfigUpdated = ContractEventLog<{
  asset: string;
  emission: string;
  0: string;
  1: string;
}>;
export type AssetIndexUpdated = ContractEventLog<{
  asset: string;
  index: string;
  0: string;
  1: string;
}>;
export type Cooldown = ContractEventLog<{
  user: string;
  0: string;
}>;
export type DelegateChanged = ContractEventLog<{
  delegator: string;
  delegatee: string;
  delegationType: string;
  0: string;
  1: string;
  2: string;
}>;
export type DelegatedPowerChanged = ContractEventLog<{
  user: string;
  amount: string;
  delegationType: string;
  0: string;
  1: string;
  2: string;
}>;
export type Redeem = ContractEventLog<{
  from: string;
  to: string;
  amount: string;
  0: string;
  1: string;
  2: string;
}>;
export type RewardsAccrued = ContractEventLog<{
  user: string;
  amount: string;
  0: string;
  1: string;
}>;
export type RewardsClaimed = ContractEventLog<{
  from: string;
  to: string;
  amount: string;
  0: string;
  1: string;
  2: string;
}>;
export type Staked = ContractEventLog<{
  from: string;
  onBehalfOf: string;
  amount: string;
  0: string;
  1: string;
  2: string;
}>;
export type Transfer = ContractEventLog<{
  from: string;
  to: string;
  value: string;
  0: string;
  1: string;
  2: string;
}>;
export type UserIndexUpdated = ContractEventLog<{
  user: string;
  asset: string;
  index: string;
  0: string;
  1: string;
  2: string;
}>;

export interface AaveSAAVEAbi extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): AaveSAAVEAbi;
  clone(): AaveSAAVEAbi;
  methods: {
    COOLDOWN_SECONDS(): NonPayableTransactionObject<string>;

    DELEGATE_BY_TYPE_TYPEHASH(): NonPayableTransactionObject<string>;

    DELEGATE_TYPEHASH(): NonPayableTransactionObject<string>;

    DISTRIBUTION_END(): NonPayableTransactionObject<string>;

    DOMAIN_SEPARATOR(): NonPayableTransactionObject<string>;

    EIP712_REVISION(): NonPayableTransactionObject<string>;

    EMISSION_MANAGER(): NonPayableTransactionObject<string>;

    PERMIT_TYPEHASH(): NonPayableTransactionObject<string>;

    PRECISION(): NonPayableTransactionObject<string>;

    REVISION(): NonPayableTransactionObject<string>;

    REWARDS_VAULT(): NonPayableTransactionObject<string>;

    REWARD_TOKEN(): NonPayableTransactionObject<string>;

    STAKED_TOKEN(): NonPayableTransactionObject<string>;

    UNSTAKE_WINDOW(): NonPayableTransactionObject<string>;

    _aaveGovernance(): NonPayableTransactionObject<string>;

    _nonces(arg0: string): NonPayableTransactionObject<string>;

    _votingSnapshots(
      arg0: string,
      arg1: number | string | BN
    ): NonPayableTransactionObject<{
      blockNumber: string;
      value: string;
      0: string;
      1: string;
    }>;

    _votingSnapshotsCounts(arg0: string): NonPayableTransactionObject<string>;

    allowance(
      owner: string,
      spender: string
    ): NonPayableTransactionObject<string>;

    approve(
      spender: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    assets(arg0: string): NonPayableTransactionObject<{
      emissionPerSecond: string;
      lastUpdateTimestamp: string;
      index: string;
      0: string;
      1: string;
      2: string;
    }>;

    balanceOf(account: string): NonPayableTransactionObject<string>;

    claimRewards(
      to: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    configureAssets(
      assetsConfigInput: [number | string | BN, number | string | BN, string][]
    ): NonPayableTransactionObject<void>;

    cooldown(): NonPayableTransactionObject<void>;

    decimals(): NonPayableTransactionObject<string>;

    decreaseAllowance(
      spender: string,
      subtractedValue: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    delegate(delegatee: string): NonPayableTransactionObject<void>;

    delegateBySig(
      delegatee: string,
      nonce: number | string | BN,
      expiry: number | string | BN,
      v: number | string | BN,
      r: string | number[],
      s: string | number[]
    ): NonPayableTransactionObject<void>;

    delegateByType(
      delegatee: string,
      delegationType: number | string | BN
    ): NonPayableTransactionObject<void>;

    delegateByTypeBySig(
      delegatee: string,
      delegationType: number | string | BN,
      nonce: number | string | BN,
      expiry: number | string | BN,
      v: number | string | BN,
      r: string | number[],
      s: string | number[]
    ): NonPayableTransactionObject<void>;

    getDelegateeByType(
      delegator: string,
      delegationType: number | string | BN
    ): NonPayableTransactionObject<string>;

    getNextCooldownTimestamp(
      fromCooldownTimestamp: number | string | BN,
      amountToReceive: number | string | BN,
      toAddress: string,
      toBalance: number | string | BN
    ): NonPayableTransactionObject<string>;

    getPowerAtBlock(
      user: string,
      blockNumber: number | string | BN,
      delegationType: number | string | BN
    ): NonPayableTransactionObject<string>;

    getPowerCurrent(
      user: string,
      delegationType: number | string | BN
    ): NonPayableTransactionObject<string>;

    getTotalRewardsBalance(staker: string): NonPayableTransactionObject<string>;

    getUserAssetData(
      user: string,
      asset: string
    ): NonPayableTransactionObject<string>;

    increaseAllowance(
      spender: string,
      addedValue: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    initialize(): NonPayableTransactionObject<void>;

    name(): NonPayableTransactionObject<string>;

    permit(
      owner: string,
      spender: string,
      value: number | string | BN,
      deadline: number | string | BN,
      v: number | string | BN,
      r: string | number[],
      s: string | number[]
    ): NonPayableTransactionObject<void>;

    redeem(
      to: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    stake(
      onBehalfOf: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    stakerRewardsToClaim(arg0: string): NonPayableTransactionObject<string>;

    stakersCooldowns(arg0: string): NonPayableTransactionObject<string>;

    symbol(): NonPayableTransactionObject<string>;

    totalSupply(): NonPayableTransactionObject<string>;

    totalSupplyAt(
      blockNumber: number | string | BN
    ): NonPayableTransactionObject<string>;

    transfer(
      recipient: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    transferFrom(
      sender: string,
      recipient: string,
      amount: number | string | BN
    ): NonPayableTransactionObject<boolean>;
  };
  events: {
    Approval(cb?: Callback<Approval>): EventEmitter;
    Approval(options?: EventOptions, cb?: Callback<Approval>): EventEmitter;

    AssetConfigUpdated(cb?: Callback<AssetConfigUpdated>): EventEmitter;
    AssetConfigUpdated(
      options?: EventOptions,
      cb?: Callback<AssetConfigUpdated>
    ): EventEmitter;

    AssetIndexUpdated(cb?: Callback<AssetIndexUpdated>): EventEmitter;
    AssetIndexUpdated(
      options?: EventOptions,
      cb?: Callback<AssetIndexUpdated>
    ): EventEmitter;

    Cooldown(cb?: Callback<Cooldown>): EventEmitter;
    Cooldown(options?: EventOptions, cb?: Callback<Cooldown>): EventEmitter;

    DelegateChanged(cb?: Callback<DelegateChanged>): EventEmitter;
    DelegateChanged(
      options?: EventOptions,
      cb?: Callback<DelegateChanged>
    ): EventEmitter;

    DelegatedPowerChanged(cb?: Callback<DelegatedPowerChanged>): EventEmitter;
    DelegatedPowerChanged(
      options?: EventOptions,
      cb?: Callback<DelegatedPowerChanged>
    ): EventEmitter;

    Redeem(cb?: Callback<Redeem>): EventEmitter;
    Redeem(options?: EventOptions, cb?: Callback<Redeem>): EventEmitter;

    RewardsAccrued(cb?: Callback<RewardsAccrued>): EventEmitter;
    RewardsAccrued(
      options?: EventOptions,
      cb?: Callback<RewardsAccrued>
    ): EventEmitter;

    RewardsClaimed(cb?: Callback<RewardsClaimed>): EventEmitter;
    RewardsClaimed(
      options?: EventOptions,
      cb?: Callback<RewardsClaimed>
    ): EventEmitter;

    Staked(cb?: Callback<Staked>): EventEmitter;
    Staked(options?: EventOptions, cb?: Callback<Staked>): EventEmitter;

    Transfer(cb?: Callback<Transfer>): EventEmitter;
    Transfer(options?: EventOptions, cb?: Callback<Transfer>): EventEmitter;

    UserIndexUpdated(cb?: Callback<UserIndexUpdated>): EventEmitter;
    UserIndexUpdated(
      options?: EventOptions,
      cb?: Callback<UserIndexUpdated>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "Approval", cb: Callback<Approval>): void;
  once(event: "Approval", options: EventOptions, cb: Callback<Approval>): void;

  once(event: "AssetConfigUpdated", cb: Callback<AssetConfigUpdated>): void;
  once(
    event: "AssetConfigUpdated",
    options: EventOptions,
    cb: Callback<AssetConfigUpdated>
  ): void;

  once(event: "AssetIndexUpdated", cb: Callback<AssetIndexUpdated>): void;
  once(
    event: "AssetIndexUpdated",
    options: EventOptions,
    cb: Callback<AssetIndexUpdated>
  ): void;

  once(event: "Cooldown", cb: Callback<Cooldown>): void;
  once(event: "Cooldown", options: EventOptions, cb: Callback<Cooldown>): void;

  once(event: "DelegateChanged", cb: Callback<DelegateChanged>): void;
  once(
    event: "DelegateChanged",
    options: EventOptions,
    cb: Callback<DelegateChanged>
  ): void;

  once(
    event: "DelegatedPowerChanged",
    cb: Callback<DelegatedPowerChanged>
  ): void;
  once(
    event: "DelegatedPowerChanged",
    options: EventOptions,
    cb: Callback<DelegatedPowerChanged>
  ): void;

  once(event: "Redeem", cb: Callback<Redeem>): void;
  once(event: "Redeem", options: EventOptions, cb: Callback<Redeem>): void;

  once(event: "RewardsAccrued", cb: Callback<RewardsAccrued>): void;
  once(
    event: "RewardsAccrued",
    options: EventOptions,
    cb: Callback<RewardsAccrued>
  ): void;

  once(event: "RewardsClaimed", cb: Callback<RewardsClaimed>): void;
  once(
    event: "RewardsClaimed",
    options: EventOptions,
    cb: Callback<RewardsClaimed>
  ): void;

  once(event: "Staked", cb: Callback<Staked>): void;
  once(event: "Staked", options: EventOptions, cb: Callback<Staked>): void;

  once(event: "Transfer", cb: Callback<Transfer>): void;
  once(event: "Transfer", options: EventOptions, cb: Callback<Transfer>): void;

  once(event: "UserIndexUpdated", cb: Callback<UserIndexUpdated>): void;
  once(
    event: "UserIndexUpdated",
    options: EventOptions,
    cb: Callback<UserIndexUpdated>
  ): void;
}