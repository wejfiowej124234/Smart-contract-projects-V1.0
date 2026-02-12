import path from "node:path";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { readJson, listJsonFilesInDir, writeJson } from "./fs";

export type DeploymentsJson = {
  chainId: number;
  usd8Address: string;
  wethAddress: string;
  simpleLendingAddress: string;
};

/** Multi-chain: frontend deployments.json is Record<chainId, DeploymentsJson> keyed by string. */
export type DeploymentsMapJson = Record<string, DeploymentsJson>;

export async function exportArtifacts(
  hre: HardhatRuntimeEnvironment,
  deployments: DeploymentsJson
): Promise<void> {
  const testTokenArtifact = await hre.artifacts.readArtifact("TestToken");
  const simpleLendingArtifact = await hre.artifacts.readArtifact("SimpleLending");

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
}
