/**
 * 输出 Create proposal 弹窗可直接复制粘贴的 4 项（仅读 deployments，不发送交易）
 * 运行：node scripts/governance/print-proposal-inputs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const deploymentsPath = path.join(root, "deployments", "31337.json");

if (!fs.existsSync(deploymentsPath)) {
  console.error("未找到 deployments/31337.json，请先部署（deploy:localhost 或 deploy:p9）");
  process.exit(1);
}

const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
const { configuratorAddress, usd8Address } = deployments;
if (!configuratorAddress || !usd8Address) {
  console.error("deployments/31337.json 缺少 configuratorAddress 或 usd8Address");
  process.exit(1);
}

// setLTV(address,uint256) 的 ABI 编码：selector + address(32) + uint256(32)
// selector = first 4 bytes of keccak256("setLTV(address,uint256)")
const { ethers } = await import("ethers");
const iface = new ethers.Interface([
  "function setLTV(address asset, uint256 ltv) external",
]);
const calldata = iface.encodeFunctionData("setLTV", [usd8Address, 76]);

console.log("--- 复制下面 4 段到 Create proposal 弹窗（从上到下）---\n");
console.log("1. Target contract (addresses, comma-sep):");
console.log(configuratorAddress);
console.log("");
console.log("2. Values (wei, comma-sep):");
console.log("0");
console.log("");
console.log("3. Function call data (hex, comma-sep):");
console.log(calldata);
console.log("");
console.log("4. Description:");
console.log("First governance proposal: set LTV to 76");
console.log("\n--- 以上 4 项与 deployments/31337.json 一致 ---");
