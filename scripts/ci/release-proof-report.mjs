#!/usr/bin/env node
/**
 * 从已生成的 evidence-pack 输出发布级证据链（manifest SHA256、四锚点、健康检查结果）。
 * 用于 CI 或本地复现验证。用法: node scripts/ci/release-proof-report.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PACK_DIR = process.env.EVIDENCE_PACK_DIR || path.join(ROOT, "evidence-pack");
const MANIFEST_PATH = path.join(PACK_DIR, "manifest.json");
const SUMMARY_PATH = path.join(PACK_DIR, "evidence-summary.json");

function sha256Hex(content) {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

function main() {
  if (!fs.existsSync(PACK_DIR)) {
    console.error("evidence-pack not found at", PACK_DIR);
    process.exitCode = 1;
    return;
  }
  const out = [];
  out.push("--- Release-Proof Evidence Chain (four anchors + manifest) ---");

  if (fs.existsSync(SUMMARY_PATH)) {
    const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf-8"));
    if (summary.manifestSha256PreBind != null) {
      out.push(`MANIFEST_SHA256_PRE_BIND: ${summary.manifestSha256PreBind}`);
    }
    if (summary.manifestSha256Final != null) {
      out.push(`MANIFEST_SHA256_FINAL: ${summary.manifestSha256Final}`);
    }
    if (summary.manifestSha256PreBind == null && summary.manifestSha256Final == null && fs.existsSync(MANIFEST_PATH)) {
      const manifestSha = sha256Hex(fs.readFileSync(MANIFEST_PATH, "utf-8"));
      out.push(`MANIFEST_SHA256: ${manifestSha}`);
    }
    if (summary.manifestSha256PreBind == null && summary.manifestSha256Final == null && !fs.existsSync(MANIFEST_PATH)) {
      out.push("MANIFEST_SHA256: (manifest.json missing)");
    }
    out.push(`ANCHOR_COMMIT: ${summary.commitSha ?? "n/a"}`);
    out.push(`ANCHOR_NODE: ${summary.node ?? "n/a"}`);
    out.push(`ANCHOR_NPM: ${summary.npm ?? "n/a"}`);
    out.push(`ANCHOR_OS: ${summary.os ?? "n/a"}`);
    out.push(`DIAGNOSTIC_PASSED: ${summary.diagnosticPassed === true}`);
    out.push(`SENTINEL_PASSED: ${summary.sentinelPassed === true}`);
    if (summary.genesisBlockHash) out.push(`GENESIS_BLOCK_HASH: ${summary.genesisBlockHash}`);
    if (summary.gateFailReason) out.push(`FAIL_REASON: ${summary.gateFailReason}`);
  } else {
    if (fs.existsSync(MANIFEST_PATH)) {
      out.push(`MANIFEST_SHA256: ${sha256Hex(fs.readFileSync(MANIFEST_PATH, "utf-8"))}`);
    } else {
      out.push("MANIFEST_SHA256: (manifest.json missing)");
    }
    out.push("ANCHORS: (evidence-summary.json missing)");
  }

  out.push("---");
  console.log(out.join("\n"));
}

main();
