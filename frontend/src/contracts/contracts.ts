import { Contract, type BrowserProvider } from "ethers";
import { deployments } from "./deployments";
import { ABIS } from "./abis";

export function getContracts(provider: BrowserProvider) {
  const usd8 = new Contract(deployments.usd8Address, ABIS.TestToken, provider);
  const weth = new Contract(deployments.wethAddress, ABIS.TestToken, provider);
  const lending = new Contract(deployments.simpleLendingAddress, ABIS.SimpleLending, provider);

  return { usd8, weth, lending };
}
