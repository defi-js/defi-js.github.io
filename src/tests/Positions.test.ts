import { fmt18, networks, setWeb3Instance, useChaiBN } from "@defi.org/web3-candies";
import { TokenAmount } from "../positions/base/Position";
import Web3 from "web3";
import _ from "lodash";
import { PositionFactory } from "../positions/base/PositionFactory";
import {
  BigUIntType,
  BigUIntValue,
  BinaryCodec,
  Struct,
  StructField,
  StructFieldDefinition,
  StructType,
  TokenIdentifierType,
  TokenIdentifierValue,
  U32Type,
  U64Type,
  U64Value,
} from "@elrondnetwork/erdjs/out";
import BigNumberExt from "bignumber.js";

useChaiBN();

function config() {
  return require("../../.config.json");
}

describe("Positions", () => {
  _.values(networks).forEach((network) => {
    describe(network.name, () => {
      beforeAll(async () => {
        setWeb3Instance(new Web3(network.id == networks.eth.id ? config().ethUrl : config().bscUrl));
        require("../positions");
      });

      xit("positions", async () => {
        const positions = _.values(config().positions).map((a) => PositionFactory.create(a));
        for (const position of positions.filter((p) => !!p && p.getNetwork().id == network.id)) {
          console.log(position!.getArgs().type, position!.getAmounts().map(fmt), position!.getPendingRewards().map(fmt));
        }
      });

      xit("struct codec ", async () => {
        const codec = new BinaryCodec();
        const type = new StructType("WrappedFarmTokenAttributes", [
          new StructFieldDefinition("farm_token_id", "", new TokenIdentifierType()),
          new StructFieldDefinition("farm_token_nonce", "", new U64Type()),
          new StructFieldDefinition("farm_token_amount", "", new BigUIntType()),
          new StructFieldDefinition("farming_token_id", "", new TokenIdentifierType()),
          new StructFieldDefinition("farming_token_nonce", "", new U64Type()),
          new StructFieldDefinition("farming_token_amount", "", new BigUIntType()),
        ]);
        const value = new Struct(type, [
          new StructField(new TokenIdentifierValue(Buffer.from("0e4d45584641524d2d653761663532", "hex")), "farm_token_id"),
          new StructField(new U64Value(BigNumberExt.max(12345)), "farm_token_nonce"),
          new StructField(new BigUIntValue(BigNumberExt.max(987654321987654321)), "farm_token_amount"),
          new StructField(new TokenIdentifierValue(Buffer.from("0c4c4b4d45582d616162393130", "hex")), "farming_token_id"),
          new StructField(new U64Value(BigNumberExt.max(12345)), "farming_token_nonce"),
          new StructField(new BigUIntValue(BigNumberExt.max(987654321987654321)), "farming_token_amount"),
        ]);
        const result = codec.encodeNested(value);
        console.log(result);
        const result2 = codec.decodeNested(result, type);
        console.log(result2);
      });
    });
  });
});

function fmt(a: TokenAmount) {
  return `${a.asset.name}:${fmt18(a.amount).split(".")[0]}=$${fmt18(a.value).split(".")[0]}`;
}
