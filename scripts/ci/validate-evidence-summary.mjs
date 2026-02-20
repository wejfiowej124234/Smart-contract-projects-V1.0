#!/usr/bin/env node
/**
 * Release-proof gate: validate evidence-summary (four anchors, diagnosticPassed, sentinelPassed, manifest hash).
 * Exported for use by p10-local-only-gate.mjs and by unit tests.
 */
import fs from "node:fs";
import crypto from "node:crypto";

const COMMIT_SHA_HEX_LEN = 40;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[.\w-]+)?(\+[.\w-]+)?$/;

export const FAIL_REASON = {
  ANCHOR_MISSING: "ANCHOR_MISSING",
  DIAGNOSTIC_FAILED: "DIAGNOSTIC_FAILED",
  SENTINEL_FAILED: "SENTINEL_FAILED",
  MANIFEST_MISMATCH: "MANIFEST_MISMATCH",
  COMMIT_MISMATCH: "COMMIT_MISMATCH",
};

export function sha256Hex(content) {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

/**
 * Release-grade validation: evidence-summary must have diagnosticPassed===true, sentinelPassed===true,
 * four anchors present and format-correct; manifest file hash must match expected when provided.
 * @param { { summaryPath: string, manifestPath?: string, expectedManifestHash?: string, currentCommitSha?: string } } options
 *   currentCommitSha: when set (e.g. git HEAD), summary.commitSha must equal it or fail with COMMIT_MISMATCH.
 * @returns { { ok: true, summary: object } | { ok: false, summary?: object, failReason: string } }
 */
export function validateEvidenceSummary(options) {
  const { summaryPath, manifestPath, expectedManifestHash, currentCommitSha } = options ?? {};
  if (!summaryPath || !fs.existsSync(summaryPath)) return { ok: false, failReason: FAIL_REASON.ANCHOR_MISSING };
  let summary;
  try {
    summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  } catch (_) {
    return { ok: false, failReason: FAIL_REASON.ANCHOR_MISSING };
  }
  const commitSha = summary.commitSha;
  const node = summary.node;
  const npm = summary.npm;
  const os = summary.os;
  if (commitSha == null || node == null || npm == null || os == null) return { ok: false, summary, failReason: FAIL_REASON.ANCHOR_MISSING };
  if (typeof commitSha !== "string" || typeof node !== "string" || typeof npm !== "string" || typeof os !== "string") return { ok: false, summary, failReason: FAIL_REASON.ANCHOR_MISSING };
  if (commitSha.length !== COMMIT_SHA_HEX_LEN || !/^[0-9a-fA-F]{40}$/.test(commitSha)) return { ok: false, summary, failReason: FAIL_REASON.ANCHOR_MISSING };
  if (!node.startsWith("v")) return { ok: false, summary, failReason: FAIL_REASON.ANCHOR_MISSING };
  if (!SEMVER_RE.test(npm)) return { ok: false, summary, failReason: FAIL_REASON.ANCHOR_MISSING };
  if (os.trim() === "") return { ok: false, summary, failReason: FAIL_REASON.ANCHOR_MISSING };

  if (summary.diagnosticPassed !== true) return { ok: false, summary, failReason: FAIL_REASON.DIAGNOSTIC_FAILED };
  if (summary.sentinelPassed !== true) return { ok: false, summary, failReason: FAIL_REASON.SENTINEL_FAILED };

  if (currentCommitSha != null && typeof currentCommitSha === "string" && summary.commitSha !== currentCommitSha) {
    return { ok: false, summary, failReason: FAIL_REASON.COMMIT_MISMATCH };
  }

  if (expectedManifestHash != null && manifestPath && fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const actualHash = sha256Hex(manifestContent);
    if (actualHash !== expectedManifestHash) return { ok: false, summary, failReason: FAIL_REASON.MANIFEST_MISMATCH };
  }

  return { ok: true, summary };
}
