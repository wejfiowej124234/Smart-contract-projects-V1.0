#!/usr/bin/env node
/**
 * P10 Local-Only Final Gate: Engineering-Complete (Local-Only).
 * - Port strategy: if 8545 already serves RPC → print actual chainId, write gate output, exit 1.
 * - Start local chain, wait for eth_chainId=0x7a69, capture genesis block hash → evidence/p10-gate-meta.json.
 * - Run p10:ci → evidence-pack.
 * - Write evidence/p10-gate-output.txt; bind to pack: copy into evidence-pack/, manifest gets gateRunId, gateManifestSha256, files["p10-gate-output.txt"] (sha256).
 * - On success: tail output prints EVIDENCE-PACK-MANIFEST-SHA256 and COMMIT_SHA / NODE_VERSION / NPM_VERSION / OS (read from evidence-pack/evidence-summary.json), bidirectional anchor with evidence-summary for zero-trust audit.
 * - Kill process tree; exit with p10:ci code; failure blocks.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { validateEvidenceSummary, FAIL_REASON, sha256Hex as sha256HexFromValidator } from "./validate-evidence-summary.mjs";

/** Fail reasons for gate fail-fast paths (all produce minimal evidence-pack + gateFailReason). */
const GATE_FAIL_REASON = {
  GATE_VALIDATION_TEST_FAILED: "GATE_VALIDATION_TEST_FAILED",
  PORT_IN_USE: "PORT_IN_USE",
  RPC_UNREACHABLE: "RPC_UNREACHABLE",
  RPC_TIMEOUT: "RPC_TIMEOUT",
  CHAIN_ID_MISMATCH: "CHAIN_ID_MISMATCH",
  P10_CI_FAILED: "P10_CI_FAILED",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const { RPC_URL, LOCAL_CHAIN_ID } = await import(path.join(ROOT, "configs", "localChain.mjs"));
const EXPECTED_CHAIN_ID_HEX = `0x${LOCAL_CHAIN_ID.toString(16)}`;
const WAIT_MS = 200;
const WAIT_MAX_ATTEMPTS = 150; // 30s max
const EVIDENCE_DIR = path.join(ROOT, "evidence");
const EVIDENCE_PACK_DIR = path.join(ROOT, "evidence-pack");
const EVIDENCE_PACK_MANIFEST = path.join(EVIDENCE_PACK_DIR, "manifest.json");
const EVIDENCE_SUMMARY_PATH = path.join(EVIDENCE_PACK_DIR, "evidence-summary.json");
const GATE_META_PATH = path.join(EVIDENCE_DIR, "p10-gate-meta.json");
const GATE_OUTPUT_PATH = path.join(EVIDENCE_DIR, "p10-gate-output.txt");
const GATE_OUTPUT_IN_PACK = path.join(EVIDENCE_PACK_DIR, "p10-gate-output.txt");

const gateLog = [];
function log(line) {
  const s = (typeof line === "string" ? line : String(line)).endsWith("\n") ? line : line + "\n";
  gateLog.push(s);
  process.stdout.write(s);
}

function rpcRequest(method, params = []) {
  return fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }).then((r) => r.json());
}

/** Returns { inUse: boolean, chainId?: string } when in use. */
async function checkPort() {
  try {
    const body = await rpcRequest("eth_chainId");
    if (body.result != null) return { inUse: true, chainId: body.result };
  } catch (_) {}
  return { inUse: false };
}

/**
 * Wait for RPC at 8545 to return eth_chainId=0x7a69.
 * @returns { Promise<{ ready: true } | { ready: false, failReason: string }> }
 *   failReason: RPC_UNREACHABLE (no response ever), RPC_TIMEOUT (no expected chainId in time), CHAIN_ID_MISMATCH (response had wrong chainId).
 */
function waitForRpc() {
  return new Promise((resolve) => {
    let attempts = 0;
    let receivedAnyResponse = false;
    const tick = () => {
      rpcRequest("eth_chainId")
        .then((body) => {
          receivedAnyResponse = true;
          if (body.result === EXPECTED_CHAIN_ID_HEX) {
            resolve({ ready: true });
            return;
          }
          if (body.result != null) {
            resolve({ ready: false, failReason: GATE_FAIL_REASON.CHAIN_ID_MISMATCH });
            return;
          }
          attempts++;
          if (attempts >= WAIT_MAX_ATTEMPTS) {
            resolve({ ready: false, failReason: GATE_FAIL_REASON.RPC_TIMEOUT });
            return;
          }
          setTimeout(tick, WAIT_MS);
        })
        .catch(() => {
          attempts++;
          if (attempts >= WAIT_MAX_ATTEMPTS) {
            resolve({ ready: false, failReason: receivedAnyResponse ? GATE_FAIL_REASON.RPC_TIMEOUT : GATE_FAIL_REASON.RPC_UNREACHABLE });
            return;
          }
          setTimeout(tick, WAIT_MS);
        });
    };
    setTimeout(tick, WAIT_MS);
  });
}

/** eth_getBlockByNumber("0x0", false) → block.hash */
async function getGenesisBlockHash() {
  try {
    const body = await rpcRequest("eth_getBlockByNumber", ["0x0", false]);
    return body.result?.hash ?? null;
  } catch (_) {
    return null;
  }
}

function killProcessTree(pid) {
  if (pid == null) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/F", "/T", "/PID", String(pid)], { windowsHide: true });
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch (_) {
        process.kill(pid, "SIGTERM");
      }
    }
  } catch (_) {}
}

function runP10Ci() {
  const runFullPath = path.resolve(__dirname, "run-p10-full.mjs");
  const args = [runFullPath, ...process.argv.slice(2)];
  const result = spawnSync("node", args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

const sha256Hex = sha256HexFromValidator;

function writeGateOutput() {
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(GATE_OUTPUT_PATH, gateLog.join(""), "utf-8");
}

/** After p10:ci success: copy gate output into pack, update manifest (gateRunId, files["p10-gate-output.txt"], gateManifestSha256 = hash of final manifest). */
function bindGateToEvidencePack(meta) {
  if (!fs.existsSync(GATE_OUTPUT_PATH) || !fs.existsSync(EVIDENCE_PACK_MANIFEST)) return;
  const gateContent = fs.readFileSync(GATE_OUTPUT_PATH, "utf-8");
  fs.copyFileSync(GATE_OUTPUT_PATH, GATE_OUTPUT_IN_PACK);

  const manifest = JSON.parse(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"));
  manifest.gateRunId = meta.gateRunId;
  manifest.files["p10-gate-output.txt"] = { sha256: sha256Hex(gateContent) };
  const manifestContent = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(EVIDENCE_PACK_MANIFEST, manifestContent, "utf-8");
  manifest.gateManifestSha256 = sha256Hex(manifestContent);
  fs.writeFileSync(EVIDENCE_PACK_MANIFEST, JSON.stringify(manifest, null, 2), "utf-8");
}

/** Update evidence-summary.json with genesisBlockHash from meta (called from gate after p10:ci; meta already written before p10:ci so generate-evidence-pack may have read it; if not we add here). */
function ensureSummaryHasGenesis(meta) {
  const summaryPath = path.join(EVIDENCE_PACK_DIR, "evidence-summary.json");
  if (!fs.existsSync(summaryPath) || !meta.genesisBlockHash) return;
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  summary.genesisBlockHash = meta.genesisBlockHash;
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
}

/** Run test:gate-validation; returns exit code (0 = pass). */
function runGateValidationTests() {
  const testPath = path.join(ROOT, "test", "unit", "validate-evidence-summary.test.mjs");
  const result = spawnSync("node", [testPath], { cwd: ROOT, stdio: "inherit", shell: false });
  return result.status ?? 1;
}

/** Get four anchors for failure-path Evidence Chain (no p10:ci run). */
function getAnchorsForFailurePath() {
  let commitSha = "";
  let npmVer = "";
  try {
    const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf-8" });
    commitSha = (r.stdout || "").trim().slice(0, 40) || "n/a";
  } catch (_) {}
  try {
    const r = spawnSync("npm", ["-v"], { cwd: ROOT, encoding: "utf-8" });
    npmVer = (r.stdout || "").trim() || "n/a";
  } catch (_) {}
  return { commitSha, node: process.version, npm: npmVer, os: `${os.platform()}/${os.release()}` };
}

/** Optional: current git HEAD for COMMIT_MISMATCH check. Set GATE_CHECK_COMMIT=1 to enable. */
function getCurrentCommitSha() {
  if (process.env.GATE_CHECK_COMMIT !== "1" && process.env.GATE_CHECK_COMMIT !== "true") return undefined;
  try {
    const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf-8" });
    const sha = (r.stdout || "").trim().slice(0, 40);
    return sha.length === 40 ? sha : undefined;
  } catch (_) {
    return undefined;
  }
}

/** Write minimal evidence-pack when gate fails (any fail-fast). Summary includes gateFailReason. */
function writeMinimalEvidencePackForFailure(gateLogContent, failReason, anchors) {
  if (!fs.existsSync(EVIDENCE_PACK_DIR)) fs.mkdirSync(EVIDENCE_PACK_DIR, { recursive: true });
  const gateSha = sha256Hex(gateLogContent);
  fs.writeFileSync(GATE_OUTPUT_IN_PACK, gateLogContent, "utf-8");
  const summary = {
    chainId: LOCAL_CHAIN_ID,
    generatedAt: new Date().toISOString(),
    commitSha: anchors.commitSha,
    node: anchors.node,
    npm: anchors.npm,
    os: anchors.os,
    diagnosticPassed: false,
    sentinelPassed: false,
    gateFailReason: failReason,
  };
  fs.writeFileSync(EVIDENCE_SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf-8");
  const manifest = {
    version: "1.0",
    chainId: LOCAL_CHAIN_ID,
    generatedAt: new Date().toISOString(),
    commitSha: anchors.commitSha,
    description: "Minimal evidence pack (gate fail-fast)",
    files: { "p10-gate-output.txt": { sha256: gateSha } },
  };
  const manifestContent = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(EVIDENCE_PACK_MANIFEST, manifestContent, "utf-8");
}

/** Sync minimal pack: write final gate output to pack, update manifest and summary (manifestSha256PreBind/Final). Then exit 1. */
function syncMinimalPackAndExit(cleanup) {
  const finalGateContent = fs.readFileSync(GATE_OUTPUT_PATH, "utf-8");
  fs.writeFileSync(GATE_OUTPUT_IN_PACK, finalGateContent, "utf-8");
  const manifest = JSON.parse(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"));
  manifest.files["p10-gate-output.txt"] = { sha256: sha256Hex(finalGateContent) };
  fs.writeFileSync(EVIDENCE_PACK_MANIFEST, JSON.stringify(manifest, null, 2), "utf-8");
  const finalManifestHash = sha256Hex(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"));
  const summary = JSON.parse(fs.readFileSync(EVIDENCE_SUMMARY_PATH, "utf-8"));
  summary.manifestSha256PreBind = finalManifestHash;
  summary.manifestSha256Final = finalManifestHash;
  fs.writeFileSync(EVIDENCE_SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf-8");
  if (typeof cleanup === "function") cleanup();
  process.exit(1);
}

/**
 * Unified fail-fast: append Evidence Chain to gateLog, write evidence, create minimal evidence-pack with gateFailReason,
 * sync pack (final gate output + manifest sha256), update summary with two-phase hash, then exit 1.
 */
function failFastWithEvidencePack(failReason, cleanup) {
  const anchors = getAnchorsForFailurePath();
  writeGateOutput();
  writeMinimalEvidencePackForFailure(gateLog.join(""), failReason, anchors);
  const manifestHash =
    fs.existsSync(EVIDENCE_PACK_MANIFEST) ? sha256Hex(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8")) : "n/a";
  log(`EVIDENCE-PACK-MANIFEST-SHA256: ${manifestHash}`);
  log(`COMMIT_SHA: ${anchors.commitSha}`);
  log(`NODE_VERSION: ${anchors.node}`);
  log(`NPM_VERSION: ${anchors.npm}`);
  log(`OS: ${anchors.os}`);
  log("DIAGNOSTIC: n/a");
  log("SENTINEL: n/a");
  log("");
  log("--- Release-Proof Evidence Chain (four anchors + manifest) ---");
  log(`MANIFEST_SHA256_PRE_BIND: ${manifestHash}`);
  log(`MANIFEST_SHA256_FINAL: ${manifestHash}`);
  log(`ANCHOR_COMMIT: ${anchors.commitSha}`);
  log(`ANCHOR_NODE: ${anchors.node}`);
  log(`ANCHOR_NPM: ${anchors.npm}`);
  log(`ANCHOR_OS: ${anchors.os}`);
  log("DIAGNOSTIC_PASSED: false");
  log("SENTINEL_PASSED: false");
  log(`FAIL_REASON: ${failReason}`);
  log("");
  log("P10 Local-Only Gate: evidence-pack/ generated (minimal) for forensics. Gate blocked.\n");
  writeGateOutput();
  syncMinimalPackAndExit(cleanup);
}

async function main() {
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  log("P10 Local-Only Gate: running gate-validation unit tests (mandatory pre-step)...");
  const testStatus = runGateValidationTests();
  if (testStatus !== 0) {
    log("P10 Local-Only Gate: gate-validation unit tests failed. Gate blocked.\n");
    failFastWithEvidencePack(GATE_FAIL_REASON.GATE_VALIDATION_TEST_FAILED);
  }

  log("P10 Local-Only Gate: gate-validation passed, checking port 8545...");
  const port = await checkPort();
  if (port.inUse) {
    log(`P10 Local-Only Gate: port 8545 in use. actual chainId: ${port.chainId ?? "unknown"}`);
    log("P10 Local-Only Gate: stop the existing process or run 'npm run p10:ci' in two terminals (node + ci). Gate blocked.\n");
    failFastWithEvidencePack(GATE_FAIL_REASON.PORT_IN_USE);
  }

  log("P10 Local-Only Gate: starting local chain...");
  const node = spawn("npx", ["hardhat", "node"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  node.unref();

  const pid = node.pid;
  const cleanup = () => killProcessTree(pid);

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  const rpc = await waitForRpc();
  if (!rpc.ready) {
    const msg =
      rpc.failReason === GATE_FAIL_REASON.CHAIN_ID_MISMATCH
        ? "RPC returned wrong chainId (expected 0x7a69).\n"
        : rpc.failReason === GATE_FAIL_REASON.RPC_UNREACHABLE
          ? "RPC unreachable (no response from http://127.0.0.1:8545).\n"
          : "RPC did not become ready (eth_chainId) in time.\n";
    log(`P10 Local-Only Gate: ${msg}`);
    failFastWithEvidencePack(rpc.failReason, cleanup);
  }

  const genesisBlockHash = await getGenesisBlockHash();
  const gateRunId = `p10-gate-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const meta = { gateRunId, genesisBlockHash: genesisBlockHash ?? undefined };
  fs.writeFileSync(GATE_META_PATH, JSON.stringify(meta, null, 2), "utf-8");

  log("P10 Local-Only Gate: chain ready (eth_chainId=0x7a69), genesisBlockHash captured, running p10:ci...");

  const code = runP10Ci();
  cleanup();

  if (code !== 0) {
    log(`P10 Local-Only Gate: p10:ci failed (exit ${code}). Gate blocked.\n`);
    failFastWithEvidencePack(GATE_FAIL_REASON.P10_CI_FAILED);
  }

  ensureSummaryHasGenesis(meta);

  const manifestHashPreBind = fs.existsSync(EVIDENCE_PACK_MANIFEST)
    ? sha256Hex(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"))
    : null;

  log("P10 Local-Only Gate: done. evidence-pack/ generated.");
  if (manifestHashPreBind != null) {
    log(`EVIDENCE-PACK-MANIFEST-SHA256 (pre-bind): ${manifestHashPreBind}`);
  }

  const currentCommitSha = getCurrentCommitSha();
  const validation = validateEvidenceSummary({
    summaryPath: EVIDENCE_SUMMARY_PATH,
    manifestPath: EVIDENCE_PACK_MANIFEST,
    expectedManifestHash: manifestHashPreBind ?? undefined,
    currentCommitSha: currentCommitSha ?? undefined,
  });
  const summary = validation.summary;

  log(`COMMIT_SHA: ${summary?.commitSha ?? "n/a"}`);
  log(`NODE_VERSION: ${summary?.node ?? "n/a"}`);
  log(`NPM_VERSION: ${summary?.npm ?? "n/a"}`);
  log(`OS: ${summary?.os ?? "n/a"}`);
  if (summary?.diagnosticPassed === true) {
    log("DIAGNOSTIC: passed");
  } else if (summary?.diagnosticPassed === false) {
    log("DIAGNOSTIC: failed");
  } else {
    log("DIAGNOSTIC: n/a");
  }
  log("");
  log("--- Release-Proof Evidence Chain (four anchors + manifest) ---");
  log(`MANIFEST_SHA256_PRE_BIND: ${manifestHashPreBind ?? "n/a"}`);
  log(`ANCHOR_COMMIT: ${summary?.commitSha ?? "n/a"}`);
  log(`ANCHOR_NODE: ${summary?.node ?? "n/a"}`);
  log(`ANCHOR_NPM: ${summary?.npm ?? "n/a"}`);
  log(`ANCHOR_OS: ${summary?.os ?? "n/a"}`);
  log(`DIAGNOSTIC_PASSED: ${summary?.diagnosticPassed === true}`);
  log(`SENTINEL_PASSED: ${summary?.sentinelPassed === true}`);
  if (summary?.genesisBlockHash) log(`GENESIS_BLOCK_HASH: ${summary.genesisBlockHash}`);
  if (!validation.ok) {
    log(`FAIL_REASON: ${validation.failReason}`);
  }
  log("");

  writeGateOutput();
  if (fs.existsSync(GATE_META_PATH)) {
    bindGateToEvidencePack(meta);
  }

  let manifestHashFinal = fs.existsSync(EVIDENCE_PACK_MANIFEST)
    ? sha256Hex(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"))
    : null;
  log(`MANIFEST_SHA256_FINAL: ${manifestHashFinal ?? "n/a"}`);
  if (fs.existsSync(EVIDENCE_SUMMARY_PATH)) {
    const summaryToUpdate = JSON.parse(fs.readFileSync(EVIDENCE_SUMMARY_PATH, "utf-8"));
    summaryToUpdate.manifestSha256PreBind = manifestHashPreBind ?? undefined;
    summaryToUpdate.manifestSha256Final = manifestHashFinal ?? undefined;
    fs.writeFileSync(EVIDENCE_SUMMARY_PATH, JSON.stringify(summaryToUpdate, null, 2), "utf-8");
  }

  if (!validation.ok) {
    if (fs.existsSync(EVIDENCE_SUMMARY_PATH)) {
      const summaryForFail = JSON.parse(fs.readFileSync(EVIDENCE_SUMMARY_PATH, "utf-8"));
      summaryForFail.gateFailReason = validation.failReason;
      fs.writeFileSync(EVIDENCE_SUMMARY_PATH, JSON.stringify(summaryForFail, null, 2), "utf-8");
    }
    log(`P10 Local-Only Gate: validation failed (${validation.failReason}). Gate blocked. evidence-pack/ retained for forensics.\n`);
    writeGateOutput();
    process.exit(1);
  }

  writeGateOutput();
  if (fs.existsSync(GATE_META_PATH)) {
    const gateContent = fs.readFileSync(GATE_OUTPUT_PATH, "utf-8");
    fs.writeFileSync(GATE_OUTPUT_IN_PACK, gateContent, "utf-8");
    const manifest = JSON.parse(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"));
    manifest.files["p10-gate-output.txt"] = { sha256: sha256Hex(gateContent) };
    fs.writeFileSync(EVIDENCE_PACK_MANIFEST, JSON.stringify(manifest, null, 2), "utf-8");
    manifestHashFinal = sha256Hex(fs.readFileSync(EVIDENCE_PACK_MANIFEST, "utf-8"));
    const summaryFinal = JSON.parse(fs.readFileSync(EVIDENCE_SUMMARY_PATH, "utf-8"));
    summaryFinal.manifestSha256Final = manifestHashFinal;
    fs.writeFileSync(EVIDENCE_SUMMARY_PATH, JSON.stringify(summaryFinal, null, 2), "utf-8");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
