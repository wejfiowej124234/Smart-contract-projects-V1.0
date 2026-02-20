#!/usr/bin/env node
/**
 * P10: Generate release-grade Evidence Pack from deployments + optional CI output.
 * Dual-Mode: CHAIN_ID env (default 31337); EVIDENCE_PACK_DIR for multi-network isolation.
 * Reads: deployments/<chainId>.json (canonical address source; do not use pack copy at runtime).
 * Writes: manifest (chainId, commitSha, deploymentsHash), deployments-<chainId>.json, evidence-summary.json; optional diagnose-dashboard-output.txt in pack.
 * evidence-summary 含 commitSha、node、npm、os 以便防退化与可审计。
 * evidence-pack/deployments-*.json 已 gitignore，仅作发布快照，不作为地址来源。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const CHAIN_ID = Number(process.env.CHAIN_ID) || 31337;
const PACK_DIR = process.env.EVIDENCE_PACK_DIR || path.join(ROOT, "evidence-pack");
const DEPLOYMENTS_PATH = path.join(ROOT, "deployments", `${CHAIN_ID}.json`);
const CI_OUTPUT_PATH = path.join(ROOT, "evidence", "p10-ci-output.txt");
const GATE_META_PATH = path.join(ROOT, "evidence", "p10-gate-meta.json");
const E2E_META_PATH = path.join(ROOT, "evidence", "p10-e2e-meta.json");
const DIAGNOSE_OUTPUT_PATH = path.join(ROOT, "evidence", "diagnose-dashboard-output.txt");
const DIAGNOSE_FILE_IN_PACK = "diagnose-dashboard-output.txt";
const SENTINEL_OUTPUT_PATH = path.join(ROOT, "evidence", "sentinel-read-output.txt");
const SENTINEL_FILE_IN_PACK = "sentinel-read-output.txt";
const GOVERNANCE_SMOKE_PATH = path.join(ROOT, "e2e", "evidence", "governance-smoke-last-run.txt");
const GOVERNANCE_SMOKE_FILE_IN_PACK = "governance-smoke-last-run.txt";

function sha256Hex(content) {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

function parseCiOutput(content) {
  const txs = [];
  const blocks = [];
  const reads = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const txMatch = line.match(/txHash:\s*(0x[a-fA-F0-9]{64})/);
    if (txMatch) txs.push(txMatch[1]);
    const blockMatch = line.match(/block:\s*(\d+)/);
    if (blockMatch) blocks.push(Number(blockMatch[1]));
    const evidenceMatch = line.match(/\[EVIDENCE\]\s*(.+)/);
    if (evidenceMatch) reads.push(evidenceMatch[1].trim());
  }
  return { txs, blocks, reads };
}

function getCommitSha() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return process.env.COMMIT_SHA || undefined;
  }
}

function getNpmVersion() {
  try {
    return execSync("npm -v", { encoding: "utf-8" }).trim();
  } catch {
    return process.env.npm_config_user_agent?.match(/npm\/[\d.]+/)?.[0] ?? undefined;
  }
}

function main() {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) {
    console.error(`deployments/${CHAIN_ID}.json not found. Deploy or set CHAIN_ID.`);
    process.exitCode = 1;
    return;
  }

  const deploymentsContent = fs.readFileSync(DEPLOYMENTS_PATH, "utf-8");
  const deployments = JSON.parse(deploymentsContent);
  const deploymentsSha = sha256Hex(deploymentsContent);
  const commitSha = getCommitSha();

  let evidenceSummary = {
    chainId: CHAIN_ID,
    generatedAt: new Date().toISOString(),
    commitSha: commitSha,
    node: process.version,
    npm: getNpmVersion(),
    os: `${os.platform()}/${os.release()}`,
    txHashes: [],
    blockNumbers: [],
    keyReads: [],
    genesisBlockHash: undefined,
    diagnosticPassed: undefined,
    diagnosticChecksSummary: undefined,
  };
  if (fs.existsSync(DIAGNOSE_OUTPUT_PATH)) {
    const diagContent = fs.readFileSync(DIAGNOSE_OUTPUT_PATH, "utf-8");
    evidenceSummary.diagnosticPassed = /All checks passed|RESULT: All checks passed/i.test(diagContent);
    evidenceSummary.diagnosticChecksSummary = evidenceSummary.diagnosticPassed ? "all" : (diagContent.match(/First failing step[\s\S]*?Step \d+:/) || [])[0]?.trim()?.slice(0, 200) || "see " + DIAGNOSE_FILE_IN_PACK;
  }
  if (fs.existsSync(GATE_META_PATH)) {
    const gateMeta = JSON.parse(fs.readFileSync(GATE_META_PATH, "utf-8"));
    if (gateMeta.genesisBlockHash) evidenceSummary.genesisBlockHash = gateMeta.genesisBlockHash;
  }
  if (fs.existsSync(E2E_META_PATH)) {
    const e2eMeta = JSON.parse(fs.readFileSync(E2E_META_PATH, "utf-8"));
    if (e2eMeta.e2eTierUsed) evidenceSummary.e2eTierUsed = e2eMeta.e2eTierUsed;
    if (e2eMeta.fullE2ESkippedReason != null) evidenceSummary.fullE2ESkippedReason = e2eMeta.fullE2ESkippedReason;
  }
  if (fs.existsSync(CI_OUTPUT_PATH)) {
    const ciContent = fs.readFileSync(CI_OUTPUT_PATH, "utf-8");
    const parsed = parseCiOutput(ciContent);
    evidenceSummary.txHashes = [...new Set(parsed.txs)];
    evidenceSummary.blockNumbers = [...new Set(parsed.blocks)].sort((a, b) => a - b);
    evidenceSummary.keyReads = parsed.reads;
  }
  if (fs.existsSync(SENTINEL_OUTPUT_PATH)) {
    const sentinelContent = fs.readFileSync(SENTINEL_OUTPUT_PATH, "utf-8");
    evidenceSummary.sentinelPassed = /SENTINEL_PASSED:\s*true/i.test(sentinelContent);
  }

  if (!fs.existsSync(PACK_DIR)) {
    fs.mkdirSync(PACK_DIR, { recursive: true });
  }

  const deploymentsFileName = `deployments-${CHAIN_ID}.json`;
  const deploymentsDest = path.join(PACK_DIR, deploymentsFileName);
  fs.writeFileSync(deploymentsDest, JSON.stringify(deployments, null, 2), "utf-8");
  const summaryPath = path.join(PACK_DIR, "evidence-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(evidenceSummary, null, 2), "utf-8");

  const files = {
    [deploymentsFileName]: { sha256: sha256Hex(JSON.stringify(deployments, null, 2)) },
    "evidence-summary.json": { sha256: sha256Hex(JSON.stringify(evidenceSummary, null, 2)) },
  };
  if (fs.existsSync(DIAGNOSE_OUTPUT_PATH)) {
    const diagContent = fs.readFileSync(DIAGNOSE_OUTPUT_PATH, "utf-8");
    fs.writeFileSync(path.join(PACK_DIR, DIAGNOSE_FILE_IN_PACK), diagContent, "utf-8");
    files[DIAGNOSE_FILE_IN_PACK] = { sha256: sha256Hex(diagContent) };
  }
  if (fs.existsSync(SENTINEL_OUTPUT_PATH)) {
    const sentinelContent = fs.readFileSync(SENTINEL_OUTPUT_PATH, "utf-8");
    fs.writeFileSync(path.join(PACK_DIR, SENTINEL_FILE_IN_PACK), sentinelContent, "utf-8");
    files[SENTINEL_FILE_IN_PACK] = { sha256: sha256Hex(sentinelContent) };
  }
  if (fs.existsSync(GOVERNANCE_SMOKE_PATH)) {
    const govContent = fs.readFileSync(GOVERNANCE_SMOKE_PATH, "utf-8");
    fs.writeFileSync(path.join(PACK_DIR, GOVERNANCE_SMOKE_FILE_IN_PACK), govContent, "utf-8");
    files[GOVERNANCE_SMOKE_FILE_IN_PACK] = { sha256: sha256Hex(govContent) };
  }
  const screenshotsDir = path.join(PACK_DIR, "screenshots");
  if (fs.existsSync(screenshotsDir)) {
    const pngs = fs.readdirSync(screenshotsDir).filter((f) => f.endsWith(".png"));
    for (const name of pngs) {
      const fullPath = path.join(screenshotsDir, name);
      const content = fs.readFileSync(fullPath);
      const relKey = "screenshots/" + name;
      files[relKey] = { sha256: sha256Hex(content) };
    }
  }
  const governanceLifecyclePath = path.join(PACK_DIR, "governance-full-lifecycle.json");
  if (fs.existsSync(governanceLifecyclePath)) {
    const content = fs.readFileSync(governanceLifecyclePath, "utf-8");
    files["governance-full-lifecycle.json"] = { sha256: sha256Hex(content) };
  }
  const governanceLifecycleShaPath = path.join(PACK_DIR, "governance-full-lifecycle.sha256");
  if (fs.existsSync(governanceLifecycleShaPath)) {
    const content = fs.readFileSync(governanceLifecycleShaPath, "utf-8");
    files["governance-full-lifecycle.sha256"] = { sha256: sha256Hex(content) };
  }
  const manifest = {
    version: "1.0",
    chainId: CHAIN_ID,
    generatedAt: new Date().toISOString(),
    commitSha: commitSha,
    deploymentsHash: deploymentsSha,
    description: CHAIN_ID === 31337
      ? "P10 Release Evidence Pack: P9 full flow + Guardian E2E (local mock)"
      : `Evidence Pack chainId ${CHAIN_ID} (deploy-ready)`,
    files,
    sourceDeploymentsSha256: deploymentsSha,
    evidenceSource: fs.existsSync(CI_OUTPUT_PATH) ? "evidence/p10-ci-output.txt" : "none",
  };
  if (fs.existsSync(GATE_META_PATH)) {
    const gateMeta = JSON.parse(fs.readFileSync(GATE_META_PATH, "utf-8"));
    manifest.gateRunId = gateMeta.gateRunId;
  }
  fs.writeFileSync(path.join(PACK_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`Evidence pack written to ${PACK_DIR}/`);
  console.log(`  manifest.json (chainId=${CHAIN_ID}, commitSha=${commitSha || "n/a"}), ${deploymentsFileName}, evidence-summary.json`);
}

main();
