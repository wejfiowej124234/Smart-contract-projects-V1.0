/**
 * BL-1: Smoke check that localhost deployment is live and readable.
 * Uses deployments/31337.json; calls pool.getReserveData(poolToken). Fail = exit 1.
 * Run: npx hardhat run scripts/ci/smoke-deployed-localhost.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";

const CHAIN_ID = 31337;

async function main(): Promise<void> {
  const deploymentsPath = path.join(process.cwd(), "deployments", `${CHAIN_ID}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    console.error("BL-1 smoke: deployments/31337.json not found. Run deploy first.");
    process.exitCode = 1;
    return;
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as Record<string, unknown>;
  const poolAddress = deployments.simpleLendingAddress as string;
  const poolTokenAddress = deployments.usd8Address as string;
  if (!poolAddress || !poolTokenAddress) {
    console.error("BL-1 smoke: simpleLendingAddress or usd8Address missing in deployments.");
    process.exitCode = 1;
    return;
  }
  const pool = new hre.ethers.Contract(
    poolAddress,
    ["function getReserveData(address) view returns (uint256 ltv, uint256 lt, uint256, uint256, uint256, address)"],
    hre.ethers.provider
  );
  const data = await pool.getReserveData(poolTokenAddress);
  const ltv = typeof data.ltv !== "undefined" ? data.ltv : (data as unknown[])[0];
  const lt = typeof data.lt !== "undefined" ? data.lt : (data as unknown[])[1];
  if (ltv == null || lt == null) {
    console.error("BL-1 smoke: getReserveData returned invalid structure.");
    process.exitCode = 1;
    return;
  }
  console.log("BL-1 smoke: localhost deployment OK (getReserveData ltv=%s lt=%s)", ltv.toString(), lt.toString());
}

main().catch((e) => {
  console.error("BL-1 smoke failed:", e);
  process.exitCode = 1;
});
