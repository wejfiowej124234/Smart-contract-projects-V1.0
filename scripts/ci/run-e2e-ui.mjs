#!/usr/bin/env node
/**
 * Run UI E2E (Playwright). Expects: chain at 8545; frontend not running.
 * Builds frontend, runs preview server, waits for ready, runs Playwright, stops server. Exit 1 on E2E failure.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FRONTEND = path.join(ROOT, "frontend");
const { RPC_URL } = await import(path.join(ROOT, "configs", "localChain.mjs"));

const env = {
  ...process.env,
  VITE_LOCAL_RPC_URL: RPC_URL,
  VITE_AUTO_ADD_CHAIN: "true",
  VITE_IS_LOCAL_CHAIN: "true",
};

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";
const WAIT_MS = 1000;
const MAX_ATTEMPTS = 30;

async function waitForFrontend() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const r = await fetch(BASE_URL);
      if (r.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, WAIT_MS));
  }
  return false;
}

async function main() {
  const build = spawnSync("npm", ["run", "build", "--prefix", "frontend"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env,
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }

  const frontendChild = spawn("npx", ["vite", "preview", "--port", "5173"], {
    cwd: FRONTEND,
    stdio: "ignore",
    shell: true,
    env,
  });

  const ok = await waitForFrontend();
  if (!ok) {
    console.error("E2E: frontend did not become ready at " + BASE_URL);
    frontendChild.kill("SIGTERM");
    process.exit(1);
  }

  const evidenceDir = path.join(ROOT, "evidence");
  const e2eEvidenceDir = path.join(ROOT, "e2e", "evidence");
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
  if (!fs.existsSync(e2eEvidenceDir)) fs.mkdirSync(e2eEvidenceDir, { recursive: true });

  const distIndex = path.join(ROOT, "frontend", "dist", "index.html");
  const browsersPath =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || "", "ms-playwright");
  const pwEnv = {
    ...process.env,
    E2E_BASE_URL: BASE_URL,
    E2E_DIST_INDEX: distIndex,
    CI: "1",
    PLAYWRIGHT_BROWSERS_PATH: browsersPath,
  };

  // Ensure Chromium is installed; on download failure (e.g. ECONNRESET), fall back to system Chrome
  let useSystemChrome = false;
  const install = spawnSync("npx", ["playwright", "install", "chromium"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: pwEnv,
  });
  if (install.status !== 0) {
    console.warn("E2E: playwright install chromium failed. Trying system Chrome (channel: chrome)...");
    useSystemChrome = true;
    pwEnv.PLAYWRIGHT_USE_SYSTEM_CHROME = "1";
  }

  const pwArgs = ["playwright", "test", "--config", "e2e/playwright.config.ts"];
  const forwardArgs = process.argv.slice(2).filter((a) => a !== "--");
  if (forwardArgs.length > 0) pwArgs.push(...forwardArgs);
  if (process.env.E2E_TX_HEAVY === "1") pwArgs.push("--project=tx-heavy");

  const pw = spawnSync("npx", pwArgs, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: pwEnv,
  });

  if (pw.status !== 0) {
    try {
      fs.writeFileSync(
        path.join(evidenceDir, "e2e-failure-note.txt"),
        `E2E failed with exit code ${pw.status} at ${new Date().toISOString()}. Run 'npm run e2e:ui' with chain and frontend up to see full output.\n`,
        "utf-8"
      );
    } catch (_) {}
  }

  frontendChild.kill("SIGTERM");
  process.exit(pw.status ?? 1);
}

main();
