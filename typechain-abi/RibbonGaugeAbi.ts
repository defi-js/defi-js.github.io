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
  provider: string;
  value: string;
  0: string;
  1: string;
}>;
export type Withdraw = ContractEventLog<{
  provider: string;
  value: string;
  0: string;
  1: string;
}>;
export type UpdateLiquidityLimit = ContractEventLog<{
  user: string;
  original_balance: string;
  original_supply: string;
  working_balance: string;
  working_supply: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}>;
export type CommitOwnership = ContractEventLog<{
  admin: string;
  0: string;
}>;
export type ApplyOwnership = ContractEventLog<{
  admin: string;
  0: string;
}>;
export type Transfer = ContractEventLog<{
  _from: string;
  _to: string;
  _value: string;
  0: string;
  1: string;
  2: string;
}>;
export type Approval = ContractEventLog<{
  _owner: string;
  _spender: string;
  _value: string;
  0: string;
  1: string;
  2: string;
}>;

export interface RibbonGaugeAbi extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): RibbonGaugeAbi;
  clone(): RibbonGaugeAbi;
  methods: {
    integrate_checkpoint(): NonPayableTransactionObject<string>;

    user_checkpoint(addr: string): NonPayableTransactionObject<boolean>;

    claimable_tokens(addr: string): NonPayableTransactionObject<string>;

    claimed_reward(
      _addr: string,
      _token: string
    ): NonPayableTransactionObject<string>;

    claimable_reward(
      _user: string,
      _reward_token: string
    ): NonPayableTransactionObject<string>;

    set_rewards_receiver(_receiver: string): NonPayableTransactionObject<void>;

    "claim_rewards()"(): NonPayableTransactionObject<void>;

    "claim_rewards(address)"(_addr: string): NonPayableTransactionObject<void>;

    "claim_rewards(address,address)"(
      _addr: string,
      _receiver: string
    ): NonPayableTransactionObject<void>;

    kick(addr: string): NonPayableTransactionObject<void>;

    "deposit(uint256)"(
      _value: number | string | BN
    ): NonPayableTransactionObject<void>;

    "deposit(uint256,address)"(
      _value: number | string | BN,
      _addr: string
    ): NonPayableTransactionObject<void>;

    "deposit(uint256,address,bool)"(
      _value: number | string | BN,
      _addr: string,
      _claim_rewards: boolean
    ): NonPayableTransactionObject<void>;

    "withdraw(uint256)"(
      _value: number | string | BN
    ): NonPayableTransactionObject<void>;

    "withdraw(uint256,bool)"(
      _value: number | string | BN,
      _claim_rewards: boolean
    ): NonPayableTransactionObject<void>;

    transfer(
      _to: string,
      _value: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    transferFrom(
      _from: string,
      _to: string,
      _value: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    approve(
      _spender: string,
      _value: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    permit(
      _owner: string,
      _spender: string,
      _value: number | string | BN,
      _deadline: number | string | BN,
      _v: number | string | BN,
      _r: string | number[],
      _s: string | number[]
    ): NonPayableTransactionObject<boolean>;

    increaseAllowance(
      _spender: string,
      _added_value: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    decreaseAllowance(
      _spender: string,
      _subtracted_value: number | string | BN
    ): NonPayableTransactionObject<boolean>;

    add_reward(
      _reward_token: string,
      _distributor: string
    ): NonPayableTransactionObject<void>;

    set_reward_distributor(
      _reward_token: string,
      _distributor: string
    ): NonPayableTransactionObject<void>;

    deposit_reward_token(
      _reward_token: string,
      _amount: number | string | BN
    ): NonPayableTransactionObject<void>;

    set_killed(_is_killed: boolean): NonPayableTransactionObject<void>;

    commit_transfer_ownership(addr: string): NonPayableTransactionObject<void>;

    accept_transfer_ownership(): NonPayableTransactionObject<void>;

    name(): NonPayableTransactionObject<string>;

    symbol(): NonPayableTransactionObject<string>;

    decimals(): NonPayableTransactionObject<string>;

    minter(): NonPayableTransactionObject<string>;

    rbn_token(): NonPayableTransactionObject<string>;

    controller(): NonPayableTransactionObject<string>;

    voting_escrow(): NonPayableTransactionObject<string>;

    veboost_proxy(): NonPayableTransactionObject<string>;

    lp_token(): NonPayableTransactionObject<string>;

    version(): NonPayableTransactionObject<string>;

    DOMAIN_SEPARATOR(): NonPayableTransactionObject<string>;

    nonces(arg0: string): NonPayableTransactionObject<string>;

    future_epoch_time(): NonPayableTransactionObject<string>;

    balanceOf(arg0: string): NonPayableTransactionObject<string>;

    totalSupply(): NonPayableTransactionObject<string>;

    allowance(arg0: string, arg1: string): NonPayableTransactionObject<string>;

    working_balances(arg0: string): NonPayableTransactionObject<string>;

    working_supply(): NonPayableTransactionObject<string>;

    period(): NonPayableTransactionObject<string>;

    period_timestamp(
      arg0: number | string | BN
    ): NonPayableTransactionObject<string>;

    integrate_inv_supply(
      arg0: number | string | BN
    ): NonPayableTransactionObject<string>;

    integrate_inv_supply_of(arg0: string): NonPayableTransactionObject<string>;

    integrate_checkpoint_of(arg0: string): NonPayableTransactionObject<string>;

    integrate_fraction(arg0: string): NonPayableTransactionObject<string>;

    inflation_rate(): NonPayableTransactionObject<string>;

    reward_count(): NonPayableTransactionObject<string>;

    reward_tokens(
      arg0: number | string | BN
    ): NonPayableTransactionObject<string>;

    reward_data(
      arg0: string
    ): NonPayableTransactionObject<
      [string, string, string, string, string, string]
    >;

    rewards_receiver(arg0: string): NonPayableTransactionObject<string>;

    reward_integral_for(
      arg0: string,
      arg1: string
    ): NonPayableTransactionObject<string>;

    admin(): NonPayableTransactionObject<string>;

    future_admin(): NonPayableTransactionObject<string>;

    is_killed(): NonPayableTransactionObject<boolean>;
  };
  events: {
    Deposit(cb?: Callback<Deposit>): EventEmitter;
    Deposit(options?: EventOptions, cb?: Callback<Deposit>): EventEmitter;

    Withdraw(cb?: Callback<Withdraw>): EventEmitter;
    Withdraw(options?: EventOptions, cb?: Callback<Withdraw>): EventEmitter;

    UpdateLiquidityLimit(cb?: Callback<UpdateLiquidityLimit>): EventEmitter;
    UpdateLiquidityLimit(
      options?: EventOptions,
      cb?: Callback<UpdateLiquidityLimit>
    ): EventEmitter;

    CommitOwnership(cb?: Callback<CommitOwnership>): EventEmitter;
    CommitOwnership(
      options?: EventOptions,
      cb?: Callback<CommitOwnership>
    ): EventEmitter;

    ApplyOwnership(cb?: Callback<ApplyOwnership>): EventEmitter;
    ApplyOwnership(
      options?: EventOptions,
      cb?: Callback<ApplyOwnership>
    ): EventEmitter;

    Transfer(cb?: Callback<Transfer>): EventEmitter;
    Transfer(options?: EventOptions, cb?: Callback<Transfer>): EventEmitter;

    Approval(cb?: Callback<Approval>): EventEmitter;
    Approval(options?: EventOptions, cb?: Callback<Approval>): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "Deposit", cb: Callback<Deposit>): void;
  once(event: "Deposit", options: EventOptions, cb: Callback<Deposit>): void;

  once(event: "Withdraw", cb: Callback<Withdraw>): void;
  once(event: "Withdraw", options: EventOptions, cb: Callback<Withdraw>): void;

  once(event: "UpdateLiquidityLimit", cb: Callback<UpdateLiquidityLimit>): void;
  once(
    event: "UpdateLiquidityLimit",
    options: EventOptions,
    cb: Callback<UpdateLiquidityLimit>
  ): void;

  once(event: "CommitOwnership", cb: Callback<CommitOwnership>): void;
  once(
    event: "CommitOwnership",
    options: EventOptions,
    cb: Callback<CommitOwnership>
  ): void;

  once(event: "ApplyOwnership", cb: Callback<ApplyOwnership>): void;
  once(
    event: "ApplyOwnership",
    options: EventOptions,
    cb: Callback<ApplyOwnership>
  ): void;

  once(event: "Transfer", cb: Callback<Transfer>): void;
  once(event: "Transfer", options: EventOptions, cb: Callback<Transfer>): void;

  once(event: "Approval", cb: Callback<Approval>): void;
  once(event: "Approval", options: EventOptions, cb: Callback<Approval>): void;
}