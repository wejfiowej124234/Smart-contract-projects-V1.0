import path from "node:path";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { writeJson } from "./fs";

export type DeploymentsJson = {
  chainId: number;
  usd8Address: string;
  wethAddress: string;
  simpleLendingAddress: string;
};

export async function exportArtifacts(
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsJson
): Promise<void> {
  const testTokenArtifact = await hre.artifacts.readArtifact("TestToken");
  const simpleLendingArtifact = await hre.artifacts.readArtifact("SimpleLending");

  const rootDeploymentsPath = path.join("deployments", `${deployments.chainId}.json`);
  writeJson(rootDeploymentsPath, deployments);

  // Frontend paths (created now to keep the interface stable for Part 2)
  const frontendDeploymentsPath = path.join(
    "frontend",
    "src",
    "contracts",
    "deployments.json"
  );
  writeJson(frontendDeploymentsPath, deployments);

  writeJson(path.join("frontend", "src", "abis", "TestToken.json"), testTokenArtifact.abi);
  writeJson(
    path.join("frontend", "src", "abis", "SimpleLending.json"),
    simpleLendingArtifact.abi
  );
}
