/**
 * Institutional DAO: Emit governance audit log (chainId, block range, steps with txHash/blockNumber, final params).
 * Can run standalone (reads governor + timelock from deployments, fetches current params) or after full-lifecycle
 * (optionally merge with evidence-pack lifecycle JSON for one audit artifact).
 * Prerequisite: deploy-p9 run; deployments/<chainId>.json with governor and timelock.
 * Usage: npx hardhat run scripts/governance/governance-audit-log.ts --network localhost
 * Optional: GOVERNANCE_LIFECYCLE_JSON=evidence-pack/governance-full-lifecycle.json to merge steps from that file.
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const EVIDENCE_PACK_DIR = path.join(process.cwd(), "evidence-pack");
const AUDIT_LOG_FILE = "governance-audit-log.json";

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const block = await hre.ethers.provider.getBlock("latest");
  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const { governorAddress, timelockAddress } = deployments;
  if (!governorAddress || !timelockAddress) {
    throw new Error("Missing governorAddress or timelockAddress.");
  }

  const governor = await hre.ethers.getContractAt("GovernorP9", governorAddress);
  const timelock = await hre.ethers.getContractAt("TimelockController", timelockAddress);

  const votingDelay = await governor.votingDelay();
  const votingPeriod = await governor.votingPeriod();
  const proposalThreshold = await governor.proposalThreshold();
  const quorumNumerator = await governor.quorumNumerator();
  const minDelay = await timelock.getMinDelay();

  const auditLog: {
    schemaVersion: number;
    chainId: number;
    blockRange: { from: number; to: number };
    runAt: string;
    governorAddress: string;
    timelockAddress: string;
    steps: Array<{ step: string; txHash?: string; blockNumber?: number; contract?: string; method?: string }>;
    finalParams: {
      votingDelay: string;
      votingPeriod: string;
      proposalThreshold: string;
      quorumNumerator: string;
      timelockMinDelaySeconds: string;
    };
  } = {
    schemaVersion: 1,
    chainId,
    blockRange: { from: 0, to: block?.number ?? 0 },
    runAt: new Date().toISOString(),
    governorAddress,
    timelockAddress,
    steps: [],
    finalParams: {
      votingDelay: votingDelay.toString(),
      votingPeriod: votingPeriod.toString(),
      proposalThreshold: proposalThreshold.toString(),
      quorumNumerator: quorumNumerator.toString(),
      timelockMinDelaySeconds: minDelay.toString(),
    },
  };

  const lifecyclePath = process.env.GOVERNANCE_LIFECYCLE_JSON
    ? path.resolve(process.cwd(), process.env.GOVERNANCE_LIFECYCLE_JSON)
    : path.join(EVIDENCE_PACK_DIR, "governance-full-lifecycle.json");
  if (fs.existsSync(lifecyclePath)) {
    const lifecycle = JSON.parse(fs.readFileSync(lifecyclePath, "utf-8")) as {
      steps?: {
        delegate?: { txHash: string; blockNumber: number };
        propose?: { txHash: string; blockNumber: number };
        vote?: { txHash: string; blockNumber: number };
        queue?: { txHash: string; blockNumber: number };
        execute?: { txHash: string; blockNumber: number };
      };
    };
    const s = lifecycle.steps;
    if (s?.delegate) auditLog.steps.push({ step: "delegate", txHash: s.delegate.txHash, blockNumber: s.delegate.blockNumber, contract: "GovernanceToken", method: "delegate" });
    if (s?.propose) auditLog.steps.push({ step: "propose", txHash: s.propose.txHash, blockNumber: s.propose.blockNumber, contract: "GovernorP9", method: "propose" });
    if (s?.vote) auditLog.steps.push({ step: "vote", txHash: s.vote.txHash, blockNumber: s.vote.blockNumber, contract: "GovernorP9", method: "castVote" });
    if (s?.queue) auditLog.steps.push({ step: "queue", txHash: s.queue.txHash, blockNumber: s.queue.blockNumber, contract: "GovernorP9", method: "queue" });
    if (s?.execute) auditLog.steps.push({ step: "execute", txHash: s.execute.txHash, blockNumber: s.execute.blockNumber, contract: "TimelockController", method: "executeBatch" });
  }

  if (!fs.existsSync(EVIDENCE_PACK_DIR)) {
    fs.mkdirSync(EVIDENCE_PACK_DIR, { recursive: true });
  }
  const outPath = path.join(EVIDENCE_PACK_DIR, AUDIT_LOG_FILE);
  fs.writeFileSync(outPath, JSON.stringify(auditLog, null, 2), "utf-8");
  console.log("[EVIDENCE] Governance audit log written:", outPath);
  console.log("  finalParams:", JSON.stringify(auditLog.finalParams));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
