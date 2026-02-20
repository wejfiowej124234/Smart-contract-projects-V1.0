import path from "node:path";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { readJson, listJsonFilesInDir, writeJson } from "./fs";

export type DeploymentsJson = {
  chainId: number;
  usd8Address: string;
  wethAddress: string;
  simpleLendingAddress: string;
  aTokenAddress?: string;
  variableDebtTokenAddress?: string;
  /** P6: Oracle router address; optional until P6 deploy. */
  oracleRouterAddress?: string;
  /** Mock mode only: MockAggregator address for scenarios (setPrice / setUpdatedAt). */
  mockAggregatorAddress?: string;
  /** Security gate B1: ProxyAdmin contract address for owner check. */
  proxyAdminAddress?: string;
  /** Security gate B2/B3: PoolConfigurator address for admin check; pool = simpleLendingAddress. */
  configuratorAddress?: string;
  /** P9: Governance token (ERC20Votes) address. */
  governanceTokenAddress?: string;
  /** P9: TimelockController address. */
  timelockAddress?: string;
  /** P9: Governor (GovernorP9) address. */
  governorAddress?: string;
  /** P9: EmergencyModule address. */
  emergencyModuleAddress?: string;
};

/** Multi-chain: frontend deployments.json is Record<chainId, DeploymentsJson> keyed by string. */
export type DeploymentsMapJson = Record<string, DeploymentsJson>;

export async function exportArtifacts(
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsJson
): Promise<void> {
  const testTokenArtifact = await hre.artifacts.readArtifact("TestToken");
  const simpleLendingArtifact = await hre.artifacts.readArtifact("LendingPoolImpl");

  const deploymentsDir = path.join(process.cwd(), "deployments");
  const rootDeploymentsPath = path.join(deploymentsDir, `${deployments.chainId}.json`);
  writeJson(rootDeploymentsPath, deployments);

  const map: DeploymentsMapJson = {};
  const resolvedDir = path.resolve(deploymentsDir);
  for (const name of listJsonFilesInDir(deploymentsDir)) {
    if (name.includes("..") || path.isAbsolute(name)) continue;
    const filePath = path.resolve(deploymentsDir, name);
    if (!filePath.startsWith(resolvedDir + path.sep) && filePath !== resolvedDir) continue;
    const data = readJson<DeploymentsJson>(filePath);
    if (typeof data.chainId !== "number" || typeof data.usd8Address !== "string" || typeof data.wethAddress !== "string" || typeof data.simpleLendingAddress !== "string") continue;
    // aTokenAddress and variableDebtTokenAddress are optional (P5)
    const key = String(data.chainId);
    map[key] = data;
  }

  const frontendDeploymentsPath = path.join(
    "frontend",
    "src",
    "contracts",
    "deployments.json"
  );
  writeJson(frontendDeploymentsPath, map);

  writeJson(path.join("frontend", "src", "abis", "TestToken.json"), testTokenArtifact.abi);
  writeJson(
    path.join("frontend", "src", "abis", "SimpleLending.json"),
    simpleLendingArtifact.abi
  );
  if (deployments.governorAddress) {
    const governorArtifact = await hre.artifacts.readArtifact("GovernorP9");
    writeJson(path.join("frontend", "src", "abis", "GovernorP9.json"), governorArtifact.abi);
  }
  if (deployments.governanceTokenAddress) {
    const govTokenArtifact = await hre.artifacts.readArtifact("GovernanceToken");
    writeJson(path.join("frontend", "src", "abis", "GovToken.json"), govTokenArtifact.abi);
  }
}
