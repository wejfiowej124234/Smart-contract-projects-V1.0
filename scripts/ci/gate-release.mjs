#!/usr/bin/env node
/**
 * Optional release gate: build → frontend-manifest → governance smoke (E2E_PORT=0) → mainnet-read-only (if E2E_MAINNET_READ_ONLY=1) → evidence-pack.
 * Then writes gate-release-evidence.txt into the pack (runId, gitSha, appVersion, manifestSha256) and updates manifest.
 * Does not change ci:local. One-shot auditable release path.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const PACK_DIR = process.env.EVIDENCE_PACK_DIR || path.join(ROOT, "evidence-pack");
const GATE_EVIDENCE_FILE = "gate-release-evidence.txt";

function sha256Hex(content) {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

function getGitSha() {
  try {
    const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf-8" });
    return r.stdout?.trim() || "n/a";
  } catch {
    return process.env.COMMIT_SHA || "n/a";
  }
}

function getAppVersion() {
  try {
    const pkgPath = path.join(ROOT, "frontend", "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return pkg.version || process.env.VITE_APP_VERSION || "n/a";
    }
    return process.env.VITE_APP_VERSION || "n/a";
  } catch {
    return process.env.VITE_APP_VERSION || "n/a";
  }
}

function run(name, cmd, args, opts = {}) {
  console.log("[gate:release] " + name + "...");
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true, ...opts });
  if (result.status !== 0) {
    console.error("[gate:release] Failed: " + name);
    process.exit(result.status ?? 1);
  }
}

function main() {
  run("Frontend build", "npm", ["run", "build", "--prefix", "frontend"]);
  run("Frontend build manifest", "npm", ["run", "release:frontend-manifest"]);

  const smokeEnv = {
    ...process.env,
    E2E_GOVERNANCE_SKIP_BUILD: "1",
    E2E_PORT: process.env.E2E_PORT || "0",
    E2E_AUTO_INSTALL_BROWSERS: process.env.E2E_AUTO_INSTALL_BROWSERS || (process.env.CI === "1" ? "1" : undefined),
  };
  run("Governance smoke E2E", "node", ["scripts/ci/run-governance-smoke.mjs"], { env: smokeEnv });

  if (process.env.E2E_MAINNET_READ_ONLY === "1" || process.env.E2E_MAINNET_READ_ONLY === "true") {
    run("Mainnet read-only E2E", "npm", ["run", "e2e:mainnet-read-only"], {
      env: { ...process.env, E2E_MAINNET_READ_ONLY: "1" },
    });
  } else {
    console.log("[gate:release] Skipping mainnet-read-only (set E2E_MAINNET_READ_ONLY=1 and E2E_BASE_URL to run).");
  }

  run("Evidence pack", "node", ["scripts/ci/generate-evidence-pack.mjs"]);

  if (!fs.existsSync(PACK_DIR)) {
    console.error("[gate:release] evidence-pack not found at " + PACK_DIR);
    process.exit(1);
  }

  const manifestPath = path.join(PACK_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("[gate:release] manifest.json not found");
    process.exit(1);
  }

  const manifestContent = fs.readFileSync(manifestPath, "utf-8");
  const manifestSha256 = sha256Hex(manifestContent);
  const runId = crypto.randomUUID();
  const gitSha = getGitSha();
  const appVersion = getAppVersion();
  const timestamp = new Date().toISOString();

  const gateLines = [
    "runId=" + runId,
    "gitSha=" + gitSha,
    "appVersion=" + appVersion,
    "manifestSha256=" + manifestSha256,
    "timestamp=" + timestamp,
    "rpcHealthSnapshotSchema=chainId,status,failCount,lastOkAt,blockDrift",
    "runtimeRiskSnapshotSchema=tier,reasons",
  ];
  const gateContent = gateLines.join("\n") + "\n";
  const gatePath = path.join(PACK_DIR, GATE_EVIDENCE_FILE);
  fs.writeFileSync(gatePath, gateContent, "utf-8");

  const manifest = JSON.parse(manifestContent);
  manifest.files = manifest.files || {};
  manifest.files[GATE_EVIDENCE_FILE] = { sha256: sha256Hex(gateContent) };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  console.log("[gate:release] Done. evidence-pack/ includes " + GATE_EVIDENCE_FILE);
  console.log("  manifestSha256 (pre-gate)=" + manifestSha256);
  console.log("  runId=" + runId);
}

main();
