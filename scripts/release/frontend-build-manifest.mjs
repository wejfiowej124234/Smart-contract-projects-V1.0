#!/usr/bin/env node
/**
 * Frontend build manifest for release evidence (SHA256 build list, version anchor).
 * Run after: cd frontend && npm run build
 * Output: frontend/dist-manifest.json (or FRONTEND_DIST_MANIFEST_PATH)
 * Usage: node scripts/release/frontend-build-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

const ROOT = path.resolve(process.cwd());
const FRONTEND_DIR = path.join(ROOT, "frontend");
const DIST_DIR = path.join(FRONTEND_DIR, "dist");
const OUT_PATH = process.env.FRONTEND_DIST_MANIFEST_PATH || path.join(FRONTEND_DIR, "dist-manifest.json");
const DEPLOYMENTS_PATH = path.join(ROOT, "deployments", "31337.json");

function sha256Hex(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function collectFiles(dir, base = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = {};
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      Object.assign(files, collectFiles(full, rel));
    } else {
      const content = fs.readFileSync(full);
      files[rel] = { sha256: sha256Hex(content), size: content.length };
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error("frontend/dist not found. Run: cd frontend && npm run build");
    process.exitCode = 1;
    return;
  }

  const version = process.env.VITE_APP_VERSION || process.env.GIT_DESCRIBE || "dev";
  const buildTime = new Date().toISOString();

  let deploymentsSha256 = null;
  if (fs.existsSync(DEPLOYMENTS_PATH)) {
    deploymentsSha256 = sha256Hex(fs.readFileSync(DEPLOYMENTS_PATH, "utf8"));
  }

  const files = collectFiles(DIST_DIR);
  const manifest = {
    version,
    buildTime,
    deploymentsSha256,
    files,
  };

  const manifestPath = path.isAbsolute(OUT_PATH) ? OUT_PATH : path.join(ROOT, OUT_PATH);
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  const manifestSha = sha256Hex(JSON.stringify(manifest));
  console.log("Frontend build manifest:", manifestPath);
  console.log("  version:", version);
  console.log("  deploymentsSha256:", deploymentsSha256 || "n/a");
  console.log("  files:", Object.keys(files).length);
  console.log("  manifest SHA256:", manifestSha);
}

main();
