/**
 * Scenario: Reset — restore MockAggregator to initial price (1e8) and fresh timestamp.
 * Mock only. Run: npx hardhat run scenarios/reset.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";

const CHAIN_ID = 31337;
const INITIAL_PRICE = 1e8;

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
  await (await mock.setPrice(INITIAL_PRICE)).wait();
  const block = await hre.ethers.provider.getBlock("latest");
  await (await mock.setUpdatedAt(block?.timestamp ?? Math.floor(Date.now() / 1000))).wait();
  console.log("[scenario:reset] MockAggregator reset to price=1e8, fresh timestamp.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
