import testTokenAbi from "../abis/TestToken.json";
import simpleLendingAbi from "../abis/SimpleLending.json";

import type { InterfaceAbi } from "ethers";

export const ABIS = {
  TestToken: testTokenAbi as unknown as InterfaceAbi,
  SimpleLending: simpleLendingAbi as unknown as InterfaceAbi,
};
