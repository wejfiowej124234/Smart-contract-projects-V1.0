#!/usr/bin/env node
/**
 * 最基础运行前置：在本地链已起（8545）的前提下，执行 deploy:localhost + deploy:p9，
 * 并校验 Lending 地址为有效 0x；通过后打印「启动前端 → /diagnostics 三项确认」清单。
 * 不修改任何业务或合约逻辑。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const { RPC_URL: RPC, LOCAL_CHAIN_ID } = await import(path.join(ROOT, "configs", "localChain.mjs"));
const EXPECTED_CHAIN_ID_HEX = `0x${LOCAL_CHAIN_ID.toString(16)}`;
const LENDING_ADDR_REGEX = /^0x[a-fA-F0-9]{40}$/;

function rpc(method, params = []) {
  return fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })
    .then((r) => r.json())
    .then((j) => (j.error ? Promise.reject(new Error(j.error.message)) : j.result));
}

async function checkChain() {
  try {
    const chainId = await rpc("eth_chainId");
    if (chainId !== EXPECTED_CHAIN_ID_HEX) {
      console.error(`Expected chainId ${EXPECTED_CHAIN_ID_HEX} (${LOCAL_CHAIN_ID}), got ${chainId}. Start local chain first: npm run node`);
      process.exit(1);
    }
    console.log(`Local chain OK (chainId ${LOCAL_CHAIN_ID} at ${RPC}).`);
  } catch (e) {
    console.error(`RPC (${RPC}) unreachable. Start local chain first: npm run node`);
    process.exit(1);
  }
}

function run(cmd, args, description) {
  console.log(`\n--- ${description} ---`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`${description} failed (exit ${r.status ?? r.signal}).`);
    process.exit(r.status ?? 1);
  }
}

function getDeployments() {
  const p1 = path.join(ROOT, "deployments", `${LOCAL_CHAIN_ID}.json`);
  const p2 = path.join(ROOT, "frontend", "src", "contracts", "deployments.json");
  for (const p of [p1, p2]) {
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
      const data = raw.chainId !== undefined ? raw : raw[String(LOCAL_CHAIN_ID)];
      if (data?.simpleLendingAddress) return { path: p, ...data };
    }
  }
  return null;
}

async function main() {
  console.log("Local prereq: chain + deploy:localhost + deploy:p9, then verify Lending address.\n");
  await checkChain();

  run("npm", ["run", "deploy:localhost"], "deploy:localhost");
  run("npm", ["run", "deploy:p9"], "deploy:p9");

  const deployments = getDeployments();
  if (!deployments) {
    console.error(`Deployments file not found (deployments/${LOCAL_CHAIN_ID}.json or frontend deployments.json).`);
    process.exit(1);
  }

  const addr = deployments.simpleLendingAddress;
  if (!LENDING_ADDR_REGEX.test(addr)) {
    console.error(`Invalid simpleLendingAddress: ${addr}. Expected 0x + 40 hex.`);
    process.exit(1);
  }

  console.log(`\nLending address verified: ${addr}`);
  console.log("\n--- 最基础运行前置（部署部分）已完成 ---");
  console.log("\n下一步（证明「本地链 + 本地合约 + 钱包连接 + UI 可真实交互」）：");
  console.log("  1. 启动前端: npm run demo:frontend");
  console.log("  2. 浏览器打开 http://127.0.0.1:5173");
  console.log(`  3. MetaMask 连接本地网络（RPC ${RPC}，chainId ${LOCAL_CHAIN_ID}）`);
  console.log("  4. 打开 /diagnostics 页面，确认三项：");
  console.log(`     - Deployments = Yes（且 chainId ${LOCAL_CHAIN_ID}）`);
  console.log("     - RPC 正常（tier / fail count / last OK）");
  console.log("     - Lending: 0x... 有效地址（与上方一致）");
  console.log("\n三项均通过即表示最基础运行前置已稳定完成。\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
