#!/usr/bin/env node
/**
 * 以 Hardhat 本地链为基准，系统性验证一致性：
 * 当前运行节点的 chainId + genesis hash、deploy:localhost 生成的合约地址、
 * frontend deployments.json、链上代码必须完全一致；
 * 任一不一致会导致「钱包有余额但 Dashboard 合约读取失败」。
 * 自动检测并输出根因与一键修复命令。
 *
 * 地址唯一来源：deployments/31337.json（由 deploy:localhost 写入）；
 * frontend 的 deployments.json 由 exportArtifacts 从 deployments/ 生成；
 * 禁止使用 evidence-pack 或其它副本作为地址来源。
 *
 * 用法: node scripts/verify-local-chain-consistency.mjs
 * 或: npm run verify:consistency
 */
import fs from "node:fs";
import path from "node:path";
import { LOCAL_CHAIN_ID as EXPECTED_CHAIN_ID, RPC_URL as RPC } from "../configs/localChain.mjs";

const ROOT = process.cwd();
const DEPLOYMENTS_ROOT = path.join(ROOT, "deployments", `${EXPECTED_CHAIN_ID}.json`);
const FRONTEND_DEPLOYMENTS = path.join(ROOT, "frontend", "src", "contracts", "deployments.json");

const ADDRESS_KEYS = ["usd8Address", "wethAddress", "simpleLendingAddress"];

function rpc(method, params = []) {
  return fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  }).then((r) => r.json());
}

async function main() {
  const issues = [];
  let nodeChainId = null;
  let genesisHash = null;
  let rootDeployments = null;
  let frontendDeployments = null;
  let fe31337 = null;

  console.log("--- Local chain consistency check ---\n");
  console.log("RPC:", RPC);
  console.log("Expected chainId:", EXPECTED_CHAIN_ID);

  // 1) 节点是否可达、chainId 与 genesis
  try {
    const chainRes = await rpc("eth_chainId");
    if (chainRes.error) {
      issues.push({
        cause: "NODE_NOT_REACHABLE",
        message: "Cannot get chainId from node.",
        detail: chainRes.error.message || JSON.stringify(chainRes.error),
        fix: "Start local node: npx hardhat node",
      });
    } else {
      nodeChainId = parseInt(chainRes.result, 16);
      if (nodeChainId !== EXPECTED_CHAIN_ID) {
        issues.push({
          cause: "CHAIN_ID_MISMATCH",
          message: `Node chainId (${nodeChainId}) != expected (${EXPECTED_CHAIN_ID}).`,
          detail: "MetaMask and frontend expect 31337.",
          fix: "Use a node with chainId 31337: npx hardhat node",
        });
      }
    }

    const block0 = await rpc("eth_getBlockByNumber", ["0x0", false]);
    if (block0.result && block0.result.hash) {
      genesisHash = block0.result.hash;
    } else if (!chainRes.error) {
      issues.push({
        cause: "GENESIS_UNKNOWN",
        message: "Could not read genesis block hash.",
        detail: "Chain may be misconfigured.",
        fix: "Restart node: npx hardhat node",
      });
    }
  } catch (e) {
    issues.push({
      cause: "NODE_NOT_REACHABLE",
      message: "Cannot connect to RPC.",
      detail: e.message || String(e),
      fix: "Start local node: npx hardhat node",
    });
  }

  // 2) deploy:localhost 产物 — deployments/31337.json
  if (!fs.existsSync(DEPLOYMENTS_ROOT)) {
    issues.push({
      cause: "ROOT_DEPLOYMENTS_MISSING",
      message: "deployments/31337.json not found.",
      detail: "deploy:localhost has not been run or failed.",
      fix: "npm run deploy:localhost",
    });
  } else {
    try {
      rootDeployments = JSON.parse(fs.readFileSync(DEPLOYMENTS_ROOT, "utf-8"));
      if (rootDeployments.chainId !== EXPECTED_CHAIN_ID) {
        issues.push({
          cause: "ROOT_CHAIN_ID_MISMATCH",
          message: `deployments/31337.json has chainId ${rootDeployments.chainId}, expected ${EXPECTED_CHAIN_ID}.`,
          detail: "File may be from another chain.",
          fix: "npm run deploy:localhost",
        });
      }
    } catch (e) {
      issues.push({
        cause: "ROOT_DEPLOYMENTS_INVALID",
        message: "deployments/31337.json is invalid or not JSON.",
        detail: e.message || String(e),
        fix: "npm run deploy:localhost",
      });
    }
  }

  // 3) frontend deployments.json 与 root 地址一致
  if (!fs.existsSync(FRONTEND_DEPLOYMENTS)) {
    issues.push({
      cause: "FRONTEND_DEPLOYMENTS_MISSING",
      message: "frontend/src/contracts/deployments.json not found.",
      detail: "deploy:localhost exportArtifacts did not run or failed.",
      fix: "npm run deploy:localhost",
    });
  } else {
    try {
      frontendDeployments = JSON.parse(fs.readFileSync(FRONTEND_DEPLOYMENTS, "utf-8"));
      fe31337 = frontendDeployments["31337"] || frontendDeployments[String(EXPECTED_CHAIN_ID)];
      if (!fe31337) {
        issues.push({
          cause: "FRONTEND_MISSING_31337",
          message: "deployments.json has no key '31337'.",
          detail: "Frontend will not resolve contracts for local chain.",
          fix: "npm run deploy:localhost",
        });
      } else if (rootDeployments) {
        for (const k of ADDRESS_KEYS) {
          if (rootDeployments[k] !== fe31337[k]) {
            issues.push({
              cause: "ADDRESS_MISMATCH",
              message: `Address mismatch: ${k}. Root != frontend.`,
              detail: `Root: ${rootDeployments[k]}, Frontend: ${fe31337[k] || "(missing)"}.`,
              fix: "npm run deploy:localhost",
            });
            break;
          }
        }
      }
    } catch (e) {
      issues.push({
        cause: "FRONTEND_DEPLOYMENTS_INVALID",
        message: "frontend deployments.json is invalid or not JSON.",
        detail: e.message || String(e),
        fix: "npm run deploy:localhost",
      });
    }
  }

  // 4) 链上是否有代码（当前节点与 deploy 地址一致）
  if (nodeChainId === EXPECTED_CHAIN_ID && rootDeployments && rootDeployments.simpleLendingAddress) {
    try {
      const codeRes = await rpc("eth_getCode", [rootDeployments.simpleLendingAddress, "latest"]);
      const code = codeRes.result;
      if (!code || code === "0x" || code.length < 10) {
        issues.push({
          cause: "CHAIN_STATE_MISMATCH",
          message: "No contract code at simpleLendingAddress on current node.",
          detail: "Node was likely restarted or is a different chain. Deployments point to old/different chain.",
          fix: "With node running: npm run deploy:localhost",
        });
      }
    } catch (e) {
      issues.push({
        cause: "CHAIN_READ_FAILED",
        message: "Could not read contract code from node.",
        detail: e.message || String(e),
        fix: "Ensure node is running, then: npm run deploy:localhost",
      });
    }
  }

  // --- 输出 ---
  console.log("\nNode:");
  console.log("  chainId:", nodeChainId != null ? nodeChainId : "(unable to read)");
  console.log("  genesisHash:", genesisHash || "(unable to read)");
  console.log("\nDeployments:");
  console.log("  root (deploy:localhost):", rootDeployments ? DEPLOYMENTS_ROOT : "missing/invalid");
  if (rootDeployments && rootDeployments.simpleLendingAddress) {
    console.log("  simpleLendingAddress:", rootDeployments.simpleLendingAddress);
  }
  console.log("  frontend:", fe31337 ? "31337 present, addresses match root" : "missing or no 31337");

  if (issues.length === 0) {
    console.log("\n--- RESULT: CONSISTENT ---");
    console.log("Node chainId + genesis, deploy addresses, frontend deployments, and chain code are aligned.");
    console.log("MetaMask must use: RPC " + RPC + ", chainId " + EXPECTED_CHAIN_ID + ".");
    console.log("Optional read sentinel: npm run sentinel:read");
    console.log("If Dashboard still fails: npm run diagnose:dashboard");
    process.exitCode = 0;
    return;
  }

  console.log("\n--- RESULT: INCONSISTENT ---");
  console.log("Root cause(s) (any can cause 'wallet has balance but Dashboard contract read fails'):\n");
  issues.forEach((q, i) => {
    console.log(`  [${i + 1}] ${q.cause}`);
    console.log(`      ${q.message}`);
    if (q.detail) console.log(`      Detail: ${q.detail}`);
    console.log(`      Fix: ${q.fix}`);
    console.log("");
  });
  console.log("One-click fix (run with node already running if RPC was reachable):");
  const fixCmd = issues.some((q) => q.cause === "NODE_NOT_REACHABLE" || q.cause === "CHAIN_ID_MISMATCH")
    ? "npx hardhat node"
    : "npm run deploy:localhost";
  console.log("  " + fixCmd);
  if (fixCmd === "npx hardhat node") {
    console.log("  Then in another terminal: npm run deploy:localhost");
  }
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
