/**
 * Scenario: HighUtil — set price to stress high utilization (e.g. lower collateral value).
 * Mock only. Run: npx hardhat run scenarios/high-util.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";

const CHAIN_ID = 31337;
const PRICE = 0.8e8; // 80% of 1e8

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
  const tx = await mock.setPrice(PRICE);
  await tx.wait();
  console.log(`[scenario:high-util] MockAggregator price set to ${PRICE}. tx: ${tx.hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
