/**
 * Scenario: Crash50 — set MockAggregator price to 50% (0.5e8) for liquidation demo.
 * Mock only. Run: npx hardhat run scenarios/crash50.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";

const CHAIN_ID = 31337;
const CRASH50_PRICE = 0.5e8; // 8 decimals

async function main() {
  const deploymentsPath = path.join(process.cwd(), "deployments", `${CHAIN_ID}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments/31337.json not found. Deploy with MODE=mock first.");
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as { mockAggregatorAddress?: string };
  const mockAddr = deployments.mockAggregatorAddress;
  if (!mockAddr) {
    throw new Error("mockAggregatorAddress missing in deployments. Use MODE=mock deploy.");
  }
  const mock = await hre.ethers.getContractAt("MockAggregator", mockAddr);
  const tx = await mock.setPrice(CRASH50_PRICE);
  await tx.wait();
  console.log(`[scenario:crash50] MockAggregator price set to ${CRASH50_PRICE} (50%). tx: ${tx.hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
