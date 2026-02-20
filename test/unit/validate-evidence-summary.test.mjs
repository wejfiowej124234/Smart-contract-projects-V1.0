/**
 * Unit tests for release-proof gate validation (validateEvidenceSummary).
 * Prevents regressions in anchor/diagnostic/sentinel/manifest checks.
 * Run: node test/unit/validate-evidence-summary.test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { validateEvidenceSummary, FAIL_REASON, sha256Hex } from "../../scripts/ci/validate-evidence-summary.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

function validSummary(overrides = {}) {
  return {
    commitSha: "a".repeat(40),
    node: "v20.0.0",
    npm: "10.2.0",
    os: "win32/10.0",
    diagnosticPassed: true,
    sentinelPassed: true,
    ...overrides,
  };
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-val-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

assert.strictEqual(FAIL_REASON.ANCHOR_MISSING, "ANCHOR_MISSING");
assert.strictEqual(FAIL_REASON.DIAGNOSTIC_FAILED, "DIAGNOSTIC_FAILED");
assert.strictEqual(FAIL_REASON.SENTINEL_FAILED, "SENTINEL_FAILED");
assert.strictEqual(FAIL_REASON.MANIFEST_MISMATCH, "MANIFEST_MISMATCH");
assert.strictEqual(FAIL_REASON.COMMIT_MISMATCH, "COMMIT_MISMATCH");

// 1) Anchor missing: summary file missing
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  const r = validateEvidenceSummary({ summaryPath });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failReason, FAIL_REASON.ANCHOR_MISSING);
});
console.log("  ok - ANCHOR_MISSING (file missing)");

// 2) Anchor missing: invalid format (missing commitSha)
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify({ node: "v20", npm: "10", os: "x" }), "utf-8");
  const r = validateEvidenceSummary({ summaryPath });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failReason, FAIL_REASON.ANCHOR_MISSING);
});
console.log("  ok - ANCHOR_MISSING (invalid format)");

// 3) DIAGNOSTIC_FAILED
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary({ diagnosticPassed: false })), "utf-8");
  const r = validateEvidenceSummary({ summaryPath });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failReason, FAIL_REASON.DIAGNOSTIC_FAILED);
});
console.log("  ok - DIAGNOSTIC_FAILED");

// 4) SENTINEL_FAILED
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary({ sentinelPassed: false })), "utf-8");
  const r = validateEvidenceSummary({ summaryPath });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failReason, FAIL_REASON.SENTINEL_FAILED);
});
console.log("  ok - SENTINEL_FAILED");

// 5) MANIFEST_MISMATCH
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  const manifestPath = path.join(dir, "manifest.json");
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary()), "utf-8");
  const manifestContent = JSON.stringify({ chainId: 31337 });
  fs.writeFileSync(manifestPath, manifestContent, "utf-8");
  const wrongHash = "0".repeat(64);
  const r = validateEvidenceSummary({ summaryPath, manifestPath, expectedManifestHash: wrongHash });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failReason, FAIL_REASON.MANIFEST_MISMATCH);
});
console.log("  ok - MANIFEST_MISMATCH");

// 5b) COMMIT_MISMATCH (optional currentCommitSha)
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary()), "utf-8");
  const r = validateEvidenceSummary({ summaryPath, currentCommitSha: "b".repeat(40) });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.failReason, FAIL_REASON.COMMIT_MISMATCH);
});
console.log("  ok - COMMIT_MISMATCH");

// 6) All pass (no manifest check when expectedManifestHash omitted)
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary()), "utf-8");
  const r = validateEvidenceSummary({ summaryPath });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.summary.commitSha, "a".repeat(40));
});
console.log("  ok - all pass (no manifest)");

// 7) All pass (manifest hash matches)
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  const manifestPath = path.join(dir, "manifest.json");
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary()), "utf-8");
  const manifestContent = JSON.stringify({ chainId: 31337 });
  fs.writeFileSync(manifestPath, manifestContent, "utf-8");
  const expectedHash = sha256Hex(manifestContent);
  const r = validateEvidenceSummary({ summaryPath, manifestPath, expectedManifestHash: expectedHash });
  assert.strictEqual(r.ok, true);
});
console.log("  ok - all pass (manifest matches)");

// 8) All pass with currentCommitSha matching summary
withTempDir((dir) => {
  const summaryPath = path.join(dir, "evidence-summary.json");
  const sha = "a".repeat(40);
  fs.writeFileSync(summaryPath, JSON.stringify(validSummary({ commitSha: sha })), "utf-8");
  const r = validateEvidenceSummary({ summaryPath, currentCommitSha: sha });
  assert.strictEqual(r.ok, true);
});
console.log("  ok - all pass (commit matches)");

console.log("\nvalidate-evidence-summary: 9 tests passed.");
