/**
 * Full Crash50 + Liquidation demo: create position, set price to 50%, run liquidationCall.
 * Uses deployments/31337.json (MODE=mock deploy first). Run: npx hardhat run scenarios/crash50-liquidation-demo.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";

const CHAIN_ID = 31337;
const CRASH50_PRICE = 0.5e8;
const SUPPLY_AMOUNT = hre.ethers.parseUnits("100", 18);
const BORROW_AMOUNT = hre.ethers.parseUnits("81", 18);
const REPAY_AMOUNT = hre.ethers.parseUnits("40", 18);

async function main() {
  const deploymentsPath = path.join(process.cwd(), "deployments", `${CHAIN_ID}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments/31337.json not found. Run MODE=mock deploy first.");
  }
  const d = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as {
    simpleLendingAddress: string;
    usd8Address: string;
    configuratorAddress: string;
    mockAggregatorAddress?: string;
  };
  const [deployer, user] = await hre.ethers.getSigners();
  const pool = await hre.ethers.getContractAt("LendingPoolImpl", d.simpleLendingAddress);
  const configurator = await hre.ethers.getContractAt("PoolConfigurator", d.configuratorAddress);
  const usd8 = await hre.ethers.getContractAt("TestToken", d.usd8Address);
  const liqAddr = await pool.liquidationContract();
  if (liqAddr === hre.ethers.ZeroAddress) throw new Error("Liquidation contract not set on pool.");
  const liquidationContract = await hre.ethers.getContractAt("Liquidation", liqAddr);

  await configurator.setLTV(d.usd8Address, 81);
  await usd8.connect(user).approve(d.simpleLendingAddress, SUPPLY_AMOUNT + BORROW_AMOUNT);
  await pool.connect(user).supply(SUPPLY_AMOUNT);
  await pool.connect(user).borrow(BORROW_AMOUNT);

  if (!d.mockAggregatorAddress) throw new Error("mockAggregatorAddress missing in deployments.");
  const mock = await hre.ethers.getContractAt("MockAggregator", d.mockAggregatorAddress);
  await (await mock.setPrice(CRASH50_PRICE)).wait();

  let liquidatable = await pool.isLiquidatable(user.address);
  if (!liquidatable) {
    console.log("[crash50-liquidation-demo] Position not liquidatable after crash50; check LTV/amounts.");
    process.exitCode = 1;
    return;
  }
  await usd8.connect(deployer).approve(d.simpleLendingAddress, REPAY_AMOUNT);
  const tx = await liquidationContract.connect(deployer).liquidationCall(user.address, REPAY_AMOUNT);
  await tx.wait();
  const [, borrowedAfter] = await pool.getUserPosition(user.address);
  console.log("[crash50-liquidation-demo] liquidationCall succeeded. Borrower debt after:", borrowedAfter.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
