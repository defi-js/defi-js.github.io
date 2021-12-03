import { fmt18, networks, setWeb3Instance, useChaiBN } from "@defi.org/web3-candies";
import { TokenAmount } from "../positions/base/Position";
import Web3 from "web3";
import _ from "lodash";
import { PositionFactory } from "../positions/base/PositionFactory";

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

      it("positions", async () => {
        const positions = _.values(config().positions).map((a) => PositionFactory.create(a));
        for (const position of positions.filter((p) => !!p && p.getNetwork().id == network.id)) {
          console.log(position!.getArgs().type, position!.getAmounts().map(fmt), position!.getPendingRewards().map(fmt));
        }
      });
    });
  });
});

function fmt(a: TokenAmount) {
  return `${a.asset.name}:${fmt18(a.amount).split(".")[0]}=$${fmt18(a.value).split(".")[0]}`;
}
