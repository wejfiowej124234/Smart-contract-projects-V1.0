#!/usr/bin/env node
/**
 * One-click Governance page smoke E2E: build frontend (if needed), start preview server,
 * wait for dual health (/ + /diagnostics), run governance-page-smoke.spec.ts, then stop server.
 * Supports E2E_PORT=0 for auto free port (CI/concurrent runs). Evidence includes runId, gitSha, appVersion, port, previewPid,
 * browserInstalled, autoInstallAttempted, autoInstallSucceeded, exitCodeReason.
 * Playwright browser: pre-run check (chromium); if missing and E2E_AUTO_INSTALL_BROWSERS=1 or CI=1, auto npx playwright install --with-deps chromium.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FRONTEND = path.join(ROOT, "frontend");
const E2E_EVIDENCE = path.join(ROOT, "e2e", "evidence");
const { RPC_URL: DEFAULT_RPC } = await import(path.join(ROOT, "configs", "localChain.mjs"));

/** Semantic exit: 0 ok, 1 health_check_failed, 2 missing_browser, 3 test_failed */
const EXIT_OK = 0;
const EXIT_HEALTH_FAILED = 1;
const EXIT_MISSING_BROWSER = 2;
const EXIT_TEST_FAILED = 3;

const env = {
  ...process.env,
  VITE_LOCAL_RPC_URL: process.env.VITE_LOCAL_RPC_URL || DEFAULT_RPC,
  VITE_AUTO_ADD_CHAIN: process.env.VITE_AUTO_ADD_CHAIN || "true",
  VITE_IS_LOCAL_CHAIN: process.env.VITE_IS_LOCAL_CHAIN ?? "true",
};

const WAIT_MS = 800;
const MAX_ATTEMPTS = 40;
const PLAYWRIGHT_INSTALL_HINT = "npx playwright install chromium";

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function getGitSha() {
  try {
    return spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf-8" }).stdout?.trim() || "n/a";
  } catch {
    return process.env.COMMIT_SHA || "n/a";
  }
}

function getAppVersion() {
  try {
    const pkgPath = path.join(FRONTEND, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return pkg.version || process.env.VITE_APP_VERSION || "n/a";
    }
    return process.env.VITE_APP_VERSION || "n/a";
  } catch {
    return process.env.VITE_APP_VERSION || "n/a";
  }
}

async function resolvePort() {
  const envPort = process.env.E2E_PORT;
  if (envPort === "0") {
    return getFreePort();
  }
  if (envPort !== undefined) {
    const p = parseInt(envPort, 10);
    if (Number.isFinite(p)) return p;
  }
  return 5173;
}

async function waitForFrontend(baseUrl) {
  const rootOk = async () => {
    try {
      const r = await fetch(baseUrl);
      return r.ok;
    } catch {
      return false;
    }
  };
  const diagnosticsOk = async () => {
    try {
      const r = await fetch(baseUrl + "/diagnostics");
      return r.ok;
    } catch {
      return false;
    }
  };
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (await rootOk() && (await diagnosticsOk())) return true;
    await new Promise((r) => setTimeout(r, WAIT_MS));
  }
  return false;
}

async function isChromiumInstalled() {
  try {
    const playwright = await import("playwright");
    const exe = playwright.chromium.executablePath();
    return typeof exe === "string" && fs.existsSync(exe);
  } catch {
    return false;
  }
}

function writeEvidence(payload) {
  if (!fs.existsSync(E2E_EVIDENCE)) {
    fs.mkdirSync(E2E_EVIDENCE, { recursive: true });
  }
  const lines = [
    "runId=" + (payload.runId ?? crypto.randomUUID()),
    "gitSha=" + (payload.gitSha ?? getGitSha()),
    "appVersion=" + (payload.appVersion ?? getAppVersion()),
    "manifestSha256=" + (payload.manifestSha256 ?? process.env.EVIDENCE_MANIFEST_SHA256 ?? "n/a"),
    "timestamp=" + (payload.timestamp ?? new Date().toISOString()),
    "baseUrl=" + (payload.baseUrl ?? "n/a"),
    "port=" + (payload.port ?? "n/a"),
    "previewPid=" + (payload.previewPid ?? "n/a"),
    "browserInstalled=" + (payload.browserInstalled === true || payload.browserInstalled === false ? payload.browserInstalled : "n/a"),
    "autoInstallAttempted=" + (payload.autoInstallAttempted === true || payload.autoInstallAttempted === false ? payload.autoInstallAttempted : "n/a"),
    "autoInstallSucceeded=" + (payload.autoInstallSucceeded === true || payload.autoInstallSucceeded === false ? payload.autoInstallSucceeded : "n/a"),
    "exitCodeReason=" + (payload.exitCodeReason ?? "n/a"),
    "exitCode=" + (payload.exitCode ?? 1),
  ];
  try {
    fs.writeFileSync(path.join(E2E_EVIDENCE, "governance-smoke-last-run.txt"), lines.join("\n") + "\n", "utf-8");
  } catch (_) {}
}

async function main() {
  const port = await resolvePort();
  const baseUrl = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;
  const effectivePort = process.env.E2E_BASE_URL ? new URL(baseUrl).port || "n/a" : port;

  const skipBuild = process.env.E2E_GOVERNANCE_SKIP_BUILD === "1";
  if (!skipBuild) {
    const build = spawnSync("npm", ["run", "build", "--prefix", "frontend"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
      env,
    });
    if (build.status !== 0) {
      process.exit(build.status ?? 1);
    }
  }

  const frontendChild = spawn("npx", ["vite", "preview", "--port", String(port)], {
    cwd: FRONTEND,
    stdio: "ignore",
    shell: true,
    env: { ...env, E2E_BASE_URL: baseUrl },
  });
  const previewPid = frontendChild.pid ?? "n/a";

  const ok = await waitForFrontend(baseUrl);
  if (!ok) {
    console.error("[e2e:governance-smoke] Frontend did not become ready at " + baseUrl + " (root + /diagnostics)");
    writeEvidence({
      baseUrl,
      port: effectivePort,
      previewPid,
      exitCode: EXIT_HEALTH_FAILED,
      exitCodeReason: "health_check_failed",
      browserInstalled: "n/a",
      autoInstallAttempted: "n/a",
      autoInstallSucceeded: "n/a",
    });
    frontendChild.kill("SIGTERM");
    process.exit(EXIT_HEALTH_FAILED);
  }

  let browserInstalled = await isChromiumInstalled();
  let autoInstallAttempted = false;
  let autoInstallSucceeded = false;
  if (!browserInstalled && (process.env.E2E_AUTO_INSTALL_BROWSERS === "1" || process.env.CI === "1")) {
    autoInstallAttempted = true;
    console.log("[e2e:governance-smoke] Chromium not found; auto-installing (E2E_AUTO_INSTALL_BROWSERS=1 or CI=1)...");
    const install = spawnSync("npx", ["playwright", "install", "--with-deps", "chromium"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    browserInstalled = install.status === 0 && (await isChromiumInstalled());
    autoInstallSucceeded = browserInstalled;
  }

  if (!browserInstalled) {
    writeEvidence({
      baseUrl,
      port: effectivePort,
      previewPid,
      exitCode: EXIT_MISSING_BROWSER,
      exitCodeReason: "missing_browser",
      browserInstalled: false,
      autoInstallAttempted,
      autoInstallSucceeded,
    });
    console.error("[e2e:governance-smoke] Playwright Chromium not found. Run: " + PLAYWRIGHT_INSTALL_HINT);
    frontendChild.kill("SIGTERM");
    process.exit(EXIT_MISSING_BROWSER);
  }

  const pwEnv = {
    ...process.env,
    E2E_BASE_URL: baseUrl,
    CI: process.env.CI || "1",
  };
  const pw = spawnSync(
    "npx",
    ["playwright", "test", "e2e/governance-page-smoke.spec.ts", "--config", "e2e/playwright.config.ts"],
    {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
      env: pwEnv,
    }
  );

  const exitCode = pw.status ?? 1;
  const exitCodeReason = exitCode === 0 ? "ok" : "test_failed";
  writeEvidence({
    baseUrl,
    port: effectivePort,
    previewPid,
    exitCode,
    exitCodeReason,
    browserInstalled: true,
    autoInstallAttempted,
    autoInstallSucceeded,
  });

  frontendChild.kill("SIGTERM");
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
