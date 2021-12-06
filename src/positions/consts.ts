import _ from "lodash";
import { erc20s as erc20sOrig, contracts as contractsOrig, erc20, contract } from "@defi.org/web3-candies";
import type { RevaultFarmAbi } from "../../typechain-abi/RevaultFarmAbi";

export const erc20s = _.merge({}, erc20sOrig, {
  bsc: {
    REVA: () => erc20("REVA", "0x4FdD92Bd67Acf0676bfc45ab7168b3996F7B4A3B"),
  },
});

export const contracts = _.merge({}, contractsOrig, {
  bsc: {
    Revault_Farm: () => contract<RevaultFarmAbi>(require("../abi/RevaultFarmAbi.json"), "0x2642fa04bd1f7250be6539c5bDa36335333d9Ccd"),
  },
});
