import { Contract, type Provider } from "ethers";
import { getDeployments } from "./deployments";
import { ABIS } from "./abis";

/** Builds ethers Contract instances for USD8, WETH, and the lending pool for the given chain. We resolve addresses from deployments so that the app always reads and writes to the correct chain. */
export function getContracts(provider: Provider, chainId: number | undefined) {
  const deployments = getDeployments(chainId);
  if (!deployments) return undefined;
  const usd8 = new Contract(deployments.usd8Address, ABIS.TestToken, provider);
  const weth = new Contract(deployments.wethAddress, ABIS.TestToken, provider);
  const lending = new Contract(deployments.simpleLendingAddress, ABIS.SimpleLending, provider);
  return { usd8, weth, lending };
}
