/**
 * Scenario: Stale — set MockAggregator updatedAt to past so ChainlinkAdapter getPrice reverts (stale).
 * Mock only. Run: npx hardhat run scenarios/stale.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";

const CHAIN_ID = 31337;
const HEARTBEAT = 365 * 24 * 3600; // 1 year; stale = updatedAt older than this

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
  const block = await hre.ethers.provider.getBlock("latest");
  const staleTimestamp = (block?.timestamp ?? Math.floor(Date.now() / 1000)) - HEARTBEAT - 1;
  const mock = await hre.ethers.getContractAt("MockAggregator", mockAddr);
  const tx = await mock.setUpdatedAt(staleTimestamp);
  await tx.wait();
  console.log(`[scenario:stale] MockAggregator setUpdatedAt(${staleTimestamp}). getPrice() will revert (stale). tx: ${tx.hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
