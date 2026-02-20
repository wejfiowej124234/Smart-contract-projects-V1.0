import testTokenAbi from "../abis/TestToken.json";
import simpleLendingAbi from "../abis/SimpleLending.json";
import govTokenAbi from "../abis/GovToken.json";
import governorP9Abi from "../abis/GovernorP9.json";

import type { InterfaceAbi } from "ethers";

export const ABIS = {
  TestToken: testTokenAbi as unknown as InterfaceAbi,
  SimpleLending: simpleLendingAbi as unknown as InterfaceAbi,
  GovToken: govTokenAbi as unknown as InterfaceAbi,
  GovernorP9: governorP9Abi as unknown as InterfaceAbi,
};
