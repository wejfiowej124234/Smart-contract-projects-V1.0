/**
 * Generate scripts/release/release-manifest.json for Gate R1 (release consistency).
 * Run after deploy + before release: npm run release:manifest
 * (or npx hardhat run scripts/release/generate-manifest.ts)
 * Reads deployments/<chainId>.json and scripts/config/security-gate-<chainId>.json per chainId found.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const DEPLOYMENTS_DIR = path.join(process.cwd(), "deployments");
const CONFIG_DIR = path.join(process.cwd(), "scripts", "config");
const MANIFEST_PATH = path.join(process.cwd(), "scripts", "release", "release-manifest.json");

function sha256Hex(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

function getCommitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function main(): void {
  const commitSha = getCommitSha();
  const manifest: Record<string, { commitSha: string; deploymentsSha256: string; configSha256?: string }> = {};

  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    console.error("deployments/ not found");
    process.exitCode = 1;
    return;
  }

  const files = fs.readdirSync(DEPLOYMENTS_DIR);
  for (const name of files) {
    if (!name.endsWith(".json")) continue;
    const chainId = name.replace(".json", "");
    if (chainId !== String(Number(chainId))) continue;
    const deploymentsPath = path.join(DEPLOYMENTS_DIR, name);
    const deploymentsContent = fs.readFileSync(deploymentsPath, "utf-8");
    const deploymentsSha256 = sha256Hex(deploymentsContent);
    const configPath = path.join(CONFIG_DIR, `security-gate-${chainId}.json`);
    const configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf-8") : "";
    const configSha256 = configContent ? sha256Hex(configContent) : undefined;
    manifest[chainId] = { commitSha, deploymentsSha256, configSha256 };
  }

  const releaseDir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Wrote ${MANIFEST_PATH} (commitSha=${commitSha}, chains: ${Object.keys(manifest).join(", ")})`);
}

main();
