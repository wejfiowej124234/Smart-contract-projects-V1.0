/**
 * B4 L2 evidence file check for CI: exit 1 if chainId is L2 and evidence file is missing.
 * Prerequisite: CHAIN_ID or CI_L2_CHAIN_ID set when running on L2 release; B4 evidence file expected for L2.
 * Usage: CHAIN_ID=421614 npx hardhat run scripts/security-gate/check-b4-evidence.ts
 * Or from CI: pass chainId for the network you are releasing to.
 */
import path from "path";
import fs from "fs";
import { isL2ChainId } from "./config";

const chainIdRaw = process.env.CHAIN_ID ?? process.env.CI_L2_CHAIN_ID ?? "";
const chainId = chainIdRaw ? Number(chainIdRaw) : null;

function main(): void {
  if (chainId == null || Number.isNaN(chainId)) {
    console.log("B4 evidence check: SKIP (no CHAIN_ID or CI_L2_CHAIN_ID; not L2 release)");
    return;
  }
  if (!isL2ChainId(chainId)) {
    console.log(`B4 evidence check: SKIP (chainId=${chainId} is not L2)`);
    return;
  }
  const evidencePath = path.join(process.cwd(), "docs", "release", `B4-L2-evidence-${chainId}.json`);
  if (fs.existsSync(evidencePath)) {
    console.log(`B4 evidence check: Pass (found ${evidencePath})`);
    return;
  }
  console.error(`B4 evidence check: FAIL — L2 chainId=${chainId} requires docs/release/B4-L2-evidence-${chainId}.json. Create it or run Gate with chain that has SequencerUptimeGuard in oracle path.`);
  process.exitCode = 1;
}

main();
