#!/usr/bin/env node
/**
 * One-click start local chain (Hardhat 31337). Blocks until RPC ready; then keeps running.
 * No external network. Run in terminal 1; then run demo:frontend in terminal 2.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const { RPC_URL: RPC, LOCAL_CHAIN_ID } = await import(path.join(ROOT, "configs", "localChain.mjs"));
const EXPECTED_HEX = `0x${LOCAL_CHAIN_ID.toString(16)}`;
const WAIT_MS = 200;
const MAX_ATTEMPTS = 100;

async function rpc(method, params = []) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await res.json();
  return j.result;
}

async function waitReady() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const chainId = await rpc("eth_chainId");
      if (chainId === EXPECTED_HEX) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, WAIT_MS));
  }
  return false;
}

console.log("Starting local chain (Hardhat 31337)...");
const child = spawn("npx", ["hardhat", "node"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
});
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
child.on("exit", (code) => {
  process.exit(code ?? 1);
});

const ready = await waitReady();
if (!ready) {
  console.error("RPC did not become ready in time.");
  child.kill("SIGTERM");
  process.exit(1);
}
console.log(`Local chain ready at ${RPC} (chainId ${LOCAL_CHAIN_ID}). Start frontend with: npm run demo:frontend`);
