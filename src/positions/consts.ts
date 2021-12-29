import _ from "lodash";
import { account, contract, contracts as contractsOrig, erc20, erc20s as erc20sOrig, networks as networksOrig, web3 } from "@defi.org/web3-candies";
import type { RevaultFarmAbi } from "../../typechain-abi/RevaultFarmAbi";
import type { UniclyXUnicAbi } from "../../typechain-abi/UniclyXUnicAbi";
import type { UniclyLpAbi } from "../../typechain-abi/UniclyLpAbi";
import type { RevaultChefAbi } from "../../typechain-abi/RevaultChefAbi";
import type { RevaultStakingAbi } from "../../typechain-abi/RevaultStakingAbi";

export const erc20s = _.merge({}, erc20sOrig, {
  eth: {
    UNIC: () => erc20("UNIC", "0x94E0BAb2F6Ab1F19F4750E42d7349f2740513aD5"),
    XUNIC: () => erc20("xUNIC", "0xA62fB0c2Fb3C7b27797dC04e1fEA06C0a2Db919a"),

    Unicly_UPUNK: () => erc20("Unicly: uPUNK", "0x8d2BFfCbB19Ff14A698C424FbcDcFd17aab9b905"),
    Unicly_UJENNY: () => erc20("Unicly: uJenny", "0xa499648fD0e80FD911972BbEb069e4c20e68bF22"),
    Unicly_LP_UPUNK_ETH: () => erc20<UniclyLpAbi>("Unicly: LP uPUNK/ETH", "0xc809Af9E3490bCB2B3bA2BF15E002f0A6a1F6835", require("../abi/UniclyLpAbi.json")),
    Unicly_LP_UJENNY_ETH: () => erc20<UniclyLpAbi>("Unicly: LP uJenny/ETH", "0xEC5100AD159F660986E47AFa0CDa1081101b471d", require("../abi/UniclyLpAbi.json")),

    FODL: () => erc20("FODL", "0x4C2e59D098DF7b6cBaE0848d66DE2f8A4889b9C3"),
    FODL_XFODL: () => erc20("FODL: xFODL", "0x7e05540A61b531793742fde0514e6c136b5fbAfE"),
  },
  bsc: {
    REVA: () => erc20("REVA", "0x4FdD92Bd67Acf0676bfc45ab7168b3996F7B4A3B"),
  },
});

export const contracts = _.merge({}, contractsOrig, {
  eth: {
    Unicly_XUnicVault: () => contract<UniclyXUnicAbi>(require("../abi/UniclyXUnicAbi.json"), "0x07306aCcCB482C8619e7ed119dAA2BDF2b4389D0"),
  },
  bsc: {
    Revault_Farm: () => contract<RevaultFarmAbi>(require("../abi/RevaultFarmAbi.json"), "0x2642fa04bd1f7250be6539c5bDa36335333d9Ccd"),
    Revault_Chef: () => contract<RevaultChefAbi>(require("../abi/RevaultChefAbi.json"), "0xd7550285532f1642511b16Df858546F2593d638B"),
    Revault_RevaStaking: () => contract<RevaultStakingAbi>(require("../abi/RevaultStakingAbi.json"), "0x8B7b2a115201ACd7F95d874D6A9432FcEB9C466A"),
  },
});

export const networks = _.merge({}, networksOrig, {
  //
});

export async function currentNetwork() {
  const netId = await web3().eth.net.getId();
  return _.find(networks, (n) => n.id === netId);
}

export async function sendWithTxType(tx: any, useLegacyTx: boolean) {
  await tx.send({ from: await account(), type: useLegacyTx ? "0x0" : "0x2" });
}
