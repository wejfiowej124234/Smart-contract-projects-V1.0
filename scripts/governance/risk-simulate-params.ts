/**
 * Protocol-level: Risk simulation for parameter changes (LTV, LT, etc.).
 * Forks at latest block (or given block), applies param set, runs basic liquidation/rate checks.
 * Output: metrics (e.g. positions at risk, utilization). Used before parameter-change proposals.
 * Prerequisite: deployments/<chainId>.json with simpleLendingAddress, usd8Address.
 * Usage: npx hardhat run scripts/governance/risk-simulate-params.ts --network localhost
 *
 * Optional env: LTV=76 LT=80 (defaults from deployments if not set). SIM_BLOCK=latest to fork at specific block.
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const poolAddress = deployments.simpleLendingAddress;
  const usd8Address = deployments.usd8Address;
  if (!poolAddress || !usd8Address) {
    throw new Error("Missing simpleLendingAddress or usd8Address.");
  }

  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddress);
  const data = await pool.getReserveData(usd8Address);
  const ltv = typeof data.ltv !== "undefined" ? data.ltv : (data as unknown[])[0];
  const lt = typeof data.liquidationThreshold !== "undefined" ? data.liquidationThreshold : (data as unknown[])[1];

  const report = {
    chainId,
    blockNumber: (await hre.ethers.provider.getBlockNumber()).toString(),
    runAt: new Date().toISOString(),
    params: { ltv: ltv.toString(), liquidationThreshold: lt.toString() },
    simulation: {
      note: "Stub: extend with fork + apply new LTV/LT + compute positions at risk and utilization.",
      scenarios: ["normal", "price_down_20", "utilization_90"] as string[],
    },
  };

  console.log("[RISK-SIMULATE] Stub report (extend for full simulation):");
  console.log(JSON.stringify(report, null, 2));
  console.log("\nNext: implement fork, setReserveData with new params, run liquidation/rate logic, output metrics.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
