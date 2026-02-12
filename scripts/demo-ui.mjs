import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";

const ROOT = path.resolve(process.cwd());
const FRONTEND_DIR = path.join(ROOT, "frontend");

const RPC_HOST = process.env.RPC_HOST ?? "127.0.0.1";
const RPC_PORT = Number(process.env.RPC_PORT ?? 8545);
const UI_PORT = Number(process.env.UI_PORT ?? 5173);
const UI_HOSTS = (process.env.UI_HOSTS ? process.env.UI_HOSTS.split(",") : ["127.0.0.1", "localhost"]) //
  .map((s) => s.trim())
  .filter(Boolean);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForPort({ host, port, timeoutMs }) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket
        .once("error", () => {
          socket.destroy();
          resolve(false);
        })
        .once("connect", () => {
          socket.end();
          resolve(true);
        })
        .connect(port, host);
    });
    if (ok) return true;
    await sleep(250);
  }
  return false;
}

async function waitForAnyHostPort({ hosts, port, timeoutMs }) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    for (const host of hosts) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await waitForPort({ host, port, timeoutMs: 250 });
      if (ok) return true;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(250);
  }
  return false;
}

function runLong(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function runOnce(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? ROOT,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${cmd} ${args.join(" ")}`));
    });
  });
}

async function openUrl(url) {
  // Best-effort: do not fail the whole script if opening browser is blocked.
  try {
    if (process.platform === "win32") {
      // cmd 'start' is built-in.
      spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", shell: false, detached: true });
      return;
    }
    if (process.platform === "darwin") {
      spawn("open", [url], { stdio: "ignore", detached: true });
      return;
    }
    spawn("xdg-open", [url], { stdio: "ignore", detached: true });
  } catch {
    // ignore
  }
}

function hasNodeModules(dir) {
  return fs.existsSync(path.join(dir, "node_modules"));
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    noInstall: args.has("--no-install"),
    noOpen: args.has("--no-open"),
    forceDeploy: args.has("--force-deploy"),
  };
}

async function jsonRpc({ host, port, method, params }) {
  const res = await fetch(`http://${host}:${port}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body?.error) throw new Error(body.error?.message ?? "JSON-RPC error");
  return body.result;
}

async function hasCodeAt({ host, port, address }) {
  const code = await jsonRpc({ host, port, method: "eth_getCode", params: [address, "latest"] });
  return typeof code === "string" && code !== "0x";
}

async function canReuseDeployments({ host, port }) {
  const filePath = path.join(ROOT, "deployments", "31337.json");
  if (!fs.existsSync(filePath)) return false;

  try {
    const deployments = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const { chainId, usd8Address, wethAddress, simpleLendingAddress } = deployments ?? {};
    if (chainId !== 31337) return false;
    if (!usd8Address || !wethAddress || !simpleLendingAddress) return false;

    const [usd8Ok, wethOk, lendingOk] = await Promise.all([
      hasCodeAt({ host, port, address: usd8Address }),
      hasCodeAt({ host, port, address: wethAddress }),
      hasCodeAt({ host, port, address: simpleLendingAddress }),
    ]);
    return usd8Ok && wethOk && lendingOk;
  } catch {
    return false;
  }
}

async function main() {
  const { dryRun, noInstall, noOpen, forceDeploy } = parseArgs(process.argv);
  const uiUrl = process.env.UI_URL ?? `http://localhost:${UI_PORT}`;

  console.log(`[demo:ui] UI: ${uiUrl}`);

  if (dryRun) {
    console.log("[demo:ui] Dry run. Would run:");
    console.log("  - (optional) npm ci (root)");
    console.log("  - (optional) npm ci (frontend)");
    console.log("  - npm run node (if RPC not running)");
    console.log("  - npm run deploy:localhost");
    console.log("  - npm run dev (in frontend)");
    console.log("  - open browser to UI");
    return;
  }

  if (!noInstall) {
    if (!hasNodeModules(ROOT)) {
      console.log("[demo:ui] Installing root deps (npm ci)...");
      await runOnce("npm", ["ci"], { cwd: ROOT });
    }
    if (!hasNodeModules(FRONTEND_DIR)) {
      console.log("[demo:ui] Installing frontend deps (npm ci)...");
      await runOnce("npm", ["ci"], { cwd: FRONTEND_DIR });
    }
  }

  let nodeProc = null;
  let feProc = null;

  try {
    const rpcUp = await waitForPort({ host: RPC_HOST, port: RPC_PORT, timeoutMs: 800 });
    if (!rpcUp) {
      console.log(`[demo:ui] Starting Hardhat node on ${RPC_HOST}:${RPC_PORT}...`);
      nodeProc = runLong("npm", ["run", "-s", "node"], { cwd: ROOT });
      const ok = await waitForPort({ host: RPC_HOST, port: RPC_PORT, timeoutMs: 20_000 });
      if (!ok) throw new Error("RPC did not start in time");
    } else {
      console.log(`[demo:ui] Reusing existing RPC at ${RPC_HOST}:${RPC_PORT}`);
    }

    const force = forceDeploy || process.env.FORCE_DEPLOY === "1";
    const reuse = !force && (await canReuseDeployments({ host: RPC_HOST, port: RPC_PORT }));
    if (reuse) {
      console.log("[demo:ui] Found existing deployments on chain; skipping deploy.");
    } else {
      console.log("[demo:ui] Deploying + exporting artifacts...");
      await runOnce("npm", ["run", "-s", "deploy:localhost"], { cwd: ROOT });
    }

    // Start frontend dev server (or reuse if already running)
    const uiUp = await waitForAnyHostPort({ hosts: UI_HOSTS, port: UI_PORT, timeoutMs: 600 });
    if (!uiUp) {
      console.log(`[demo:ui] Starting frontend dev server on port ${UI_PORT}...`);
      feProc = runLong("npm", ["run", "dev"], { cwd: FRONTEND_DIR });

      // Vite may take a while on first run (optimize deps). Be generous.
      const ok = await waitForAnyHostPort({ hosts: UI_HOSTS, port: UI_PORT, timeoutMs: 90_000 });
      if (!ok) throw new Error("Frontend dev server did not start in time");
    } else {
      console.log(`[demo:ui] Reusing existing frontend at ${uiUrl}`);
    }

    if (!noOpen) {
      console.log("[demo:ui] Opening browser...");
      await openUrl(uiUrl);
    }

    console.log("[demo:ui] Ready. Keep this terminal open; press Ctrl+C to stop.");

    // Keep alive while child processes are running.
    const procs = [nodeProc, feProc].filter(Boolean);
    if (procs.length === 0) return;

    await new Promise((resolve) => {
      const onExit = () => {
        for (const p of procs) {
          try {
            p.kill();
          } catch {
            // ignore
          }
        }
        resolve();
      };
      process.on("SIGINT", onExit);
      process.on("SIGTERM", onExit);
    });
  } finally {
    // If we started processes and an error occurs before the signal handlers,
    // ensure we don't leave stray children.
    if (process.exitCode && process.exitCode !== 0) {
      for (const p of [feProc, nodeProc].filter(Boolean)) {
        try {
          p.kill();
        } catch {
          // ignore
        }
      }
    }
  }
}

main().catch((e) => {
  console.error("[demo:ui] FAILED:", e);
  process.exitCode = 1;
});
