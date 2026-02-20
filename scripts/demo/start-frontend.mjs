#!/usr/bin/env node
/**
 * One-click start frontend for local demo. Sets VITE_LOCAL_RPC_URL etc. then runs vite.
 * No external network. Run after demo:chain (or p10:gate / hardhat node).
 */
import { spawn } from "node:child_process";
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

const child = spawn("npm", ["run", "dev"], {
  cwd: FRONTEND,
  stdio: "inherit",
  shell: true,
  env,
});
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
child.on("exit", (code) => {
  process.exit(code ?? 1);
});
