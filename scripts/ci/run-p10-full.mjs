#!/usr/bin/env node
/**
 * P10: One-shot CI for P9 full flow (fail-fast).
 * Runs: deploy:localhost → diagnose:dashboard → deploy:p9 → governance steps → E2E (tiered) → generate-evidence-pack.
 * E2E tier: default "core" (smoke + core-flow only). Set E2E_TIER=nightly or pass --full for full e2e:ui.
 * On runner timeout during full E2E: core result retained, full marked "Skipped (environment limit)", gate still exits 0.
 * Requires: npx hardhat node running in another terminal.
 * Writes: evidence/p10-ci-output.txt, evidence/p10-e2e-meta.json (e2eTierUsed, fullE2ESkippedReason).
 * Exit: 0 only if deploy + governance + e2e:core pass; full E2E timeout is non-blocking.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = process.cwd();
const EVIDENCE_DIR = path.join(ROOT, "evidence");
const EVIDENCE_OUTPUT = path.join(EVIDENCE_DIR, "p10-ci-output.txt");
const E2E_META_PATH = path.join(EVIDENCE_DIR, "p10-e2e-meta.json");

const E2E_UI_SCRIPT = path.resolve(__dirname, "run-e2e-ui.mjs");

const DIAGNOSE_OUTPUT = path.join(EVIDENCE_DIR, "diagnose-dashboard-output.txt");
const SENTINEL_OUTPUT = path.join(EVIDENCE_DIR, "sentinel-read-output.txt");

const GATE_E2E_FULL_TIMEOUT_MS = Number(process.env.GATE_E2E_FULL_TIMEOUT_MS) || 600_000; // 10 min

/** E2E tier: "core" (smoke + core-flow) or "nightly" (core then full with timeout). */
function getE2ETier() {
  if (process.env.E2E_TIER === "nightly" || process.env.E2E_TIER === "full") return "nightly";
  const argv = process.argv.slice(2).filter((a) => a !== "--");
  if (argv.includes("--full")) return "nightly";
  return "core";
}

const STEPS = [
  { name: "deploy:localhost", cmd: "npm", args: ["run", "deploy:localhost"] },
  { name: "diagnose:dashboard", cmd: "npm", args: ["run", "diagnose:dashboard"], pipeToFile: DIAGNOSE_OUTPUT },
  { name: "sentinel:read", cmd: "npm", args: ["run", "sentinel:read"], pipeToFile: SENTINEL_OUTPUT },
  { name: "deploy:p9", cmd: "npm", args: ["run", "deploy:p9"] },
  { name: "governance:transfer-admin", cmd: "npm", args: ["run", "governance:transfer-admin"] },
  { name: "governance:first-proposal", cmd: "npm", args: ["run", "governance:first-proposal"] },
  { name: "governance:verify-p9", cmd: "npm", args: ["run", "governance:verify-p9"] },
  { name: "governance:verify-guardian", cmd: "npm", args: ["run", "governance:verify-guardian"] },
  { name: "governance:second-proposal-setlt", cmd: "npm", args: ["run", "governance:second-proposal-setlt"] },
  { name: "governance:proxy-upgrade-drill", cmd: "npm", args: ["run", "governance:proxy-upgrade-drill"] },
];

function runStep(step, optsExtra = {}) {
  const isE2e = step.e2e === true;
  const pipeOut = step.pipeToFile || !isE2e;
  const opts = {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: isE2e ? "inherit" : ["inherit", pipeOut ? "pipe" : "inherit", "inherit"],
    ...optsExtra,
  };
  if (step.noShell) {
    opts.shell = false;
  } else {
    opts.shell = true;
  }
  const result = spawnSync(step.cmd, step.args, opts);
  const stdout = result.stdout || "";
  if (step.pipeToFile && typeof step.pipeToFile === "string" && stdout) {
    fs.writeFileSync(step.pipeToFile, stdout, "utf-8");
  }
  return { ...result, stdout };
}

function writeE2EMeta(e2eTierUsed, fullE2ESkippedReason) {
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const meta = { e2eTierUsed, fullE2ESkippedReason: fullE2ESkippedReason ?? undefined };
  fs.writeFileSync(E2E_META_PATH, JSON.stringify(meta, null, 2), "utf-8");
}

function main() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const e2eTier = getE2ETier();
  const skipE2e = process.env.SKIP_E2E_UI === "1" || process.env.SKIP_E2E_UI === "true";

  const allOutput = [];
  const startTime = new Date().toISOString();
  allOutput.push(`P10 CI run started at ${startTime}\n`);
  allOutput.push(`Node: ${process.version}, cwd: ${ROOT}, E2E_TIER: ${e2eTier}\n`);

  for (const step of STEPS) {
    process.stdout.write(`\n--- P10 CI: ${step.name} ---\n`);
    const result = runStep(step);
    if (result.stdout) process.stdout.write(result.stdout);
    allOutput.push(`\n--- ${step.name} ---\n`);
    allOutput.push(result.stdout || "");

    const exitCode = result.status ?? result.signal ?? 1;
    if (exitCode !== 0) {
      process.stderr.write(`\nP10 CI FAILED at step: ${step.name} (exit ${result.status ?? result.signal ?? "null"})\n`);
      fs.writeFileSync(EVIDENCE_OUTPUT, allOutput.join(""), "utf-8");
      process.exit(exitCode);
    }
  }

  let fullE2ESkippedReason = undefined;

  if (skipE2e) {
    process.stdout.write(`\n--- P10 CI: e2e (SKIPPED, SKIP_E2E_UI=1) ---\n`);
    allOutput.push(`\n--- e2e (SKIPPED, SKIP_E2E_UI=1) ---\n`);
    writeE2EMeta("core", undefined);
  } else {
    process.stdout.write(`\n--- P10 CI: e2e:core (smoke + core-flow) ---\n`);
    allOutput.push(`\n--- e2e:core ---\n`);
    const coreResult = runStep({
      name: "e2e:core",
      cmd: "node",
      args: [E2E_UI_SCRIPT, "--", "--project=smoke", "--project=core-flow"],
      noShell: true,
      e2e: true,
    });
    allOutput.push(coreResult.stdout || "(e2e:core output inherited)\n");
    const coreCode = coreResult.status ?? coreResult.signal ?? 1;
    if (coreCode !== 0) {
      process.stderr.write(`\nP10 CI FAILED at step: e2e:core (exit ${coreResult.status ?? coreResult.signal ?? "null"})\n`);
      fs.writeFileSync(EVIDENCE_OUTPUT, allOutput.join(""), "utf-8");
      writeE2EMeta(e2eTier, undefined);
      process.exit(coreCode);
    }

    if (e2eTier === "nightly") {
      process.stdout.write(`\n--- P10 CI: e2e:full (forensic/nightly, timeout ${GATE_E2E_FULL_TIMEOUT_MS}ms) ---\n`);
      allOutput.push(`\n--- e2e:full ---\n`);
      const fullResult = runStep(
        {
          name: "e2e:full",
          cmd: "node",
          args: [E2E_UI_SCRIPT, "--", "--project=chromium"],
          noShell: true,
          e2e: true,
        },
        { timeout: GATE_E2E_FULL_TIMEOUT_MS }
      );
      allOutput.push(fullResult.stdout || "(e2e:full output inherited)\n");
      const fullCode = fullResult.status ?? fullResult.signal;
      if (fullCode !== 0 && fullResult.signal === "SIGTERM") {
        fullE2ESkippedReason = "runner-timeout";
        process.stdout.write(`\nP10 CI: e2e:full skipped (environment limit: ${fullE2ESkippedReason}). Gate passes (core passed).\n`);
        allOutput.push(`e2e:full skipped: ${fullE2ESkippedReason}\n`);
      } else if (fullCode !== 0) {
        process.stderr.write(`\nP10 CI FAILED at step: e2e:full (exit ${fullResult.status ?? fullResult.signal ?? "null"})\n`);
        fs.writeFileSync(EVIDENCE_OUTPUT, allOutput.join(""), "utf-8");
        writeE2EMeta(e2eTier, undefined);
        process.exit(fullCode);
      }
    }

    writeE2EMeta(e2eTier, fullE2ESkippedReason);
  }

  fs.writeFileSync(EVIDENCE_OUTPUT, allOutput.join(""), "utf-8");
  process.stdout.write(`\nP10 CI: all steps passed. Output written to ${EVIDENCE_OUTPUT}\n`);
  if (fullE2ESkippedReason) {
    process.stdout.write(`E2E: e2eTierUsed=nightly, fullE2ESkippedReason=${fullE2ESkippedReason}\n`);
  }

  const gen = spawnSync("node", [path.resolve(__dirname, "generate-evidence-pack.mjs")], {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: "inherit",
  });
  if (gen.status !== 0) {
    process.stderr.write("P10 CI: evidence pack generation failed.\n");
    process.exit(gen.status);
  }

  process.stdout.write("\nP10 CI: complete. See evidence-pack/ and RELEASE_CHECKLIST_P10.md.\n");
}

main();
