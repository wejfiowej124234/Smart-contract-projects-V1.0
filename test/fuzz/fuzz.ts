/**
 * P8: Fuzz tests. Random amounts for supply/withdraw/borrow/repay; expect success or known revert.
 */
import { expect } from "chai";
import { ethers, artifacts } from "hardhat";

const FUZZ_ITERATIONS = Number(process.env.FUZZ_ITERATIONS ?? "200");

async function deployMinimal() {
  const [deployer, user] = await ethers.getSigners();
  const TestToken = await ethers.getContractFactory("TestToken");
  const usd8 = await TestToken.deploy("USD8", "USD8");
  await usd8.waitForDeployment();
  const usd8Address = await usd8.getAddress();
  const LinearRateStrategy = await ethers.getContractFactory("LinearRateStrategy");
  const strategy = await LinearRateStrategy.deploy();
  await strategy.waitForDeployment();
  const LendingPoolImpl = await ethers.getContractFactory("LendingPoolImpl");
  const impl = await LendingPoolImpl.deploy();
  await impl.waitForDeployment();
  const proxyAdminArtifact = await artifacts.readArtifact("ProxyAdmin");
  const abiWithCtor = [
    { type: "constructor" as const, inputs: [{ name: "initialOwner", type: "address", internalType: "address" }] },
    ...(proxyAdminArtifact.abi as any[]),
  ];
  const ProxyAdminFactory = new ethers.ContractFactory(
    abiWithCtor,
    proxyAdminArtifact.bytecode,
    deployer,
  );
  const proxyAdmin = await ProxyAdminFactory.deploy(await deployer.getAddress());
  await proxyAdmin.waitForDeployment();
  const initData = LendingPoolImpl.interface.encodeFunctionData("initialize", [
    usd8Address,
    await deployer.getAddress(),
    await strategy.getAddress(),
    await deployer.getAddress(),
  ]);
  const TransparentUpgradeableProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const proxy = await TransparentUpgradeableProxy.deploy(
    await impl.getAddress(),
    await proxyAdmin.getAddress(),
    initData,
  );
  await proxy.waitForDeployment();
  const lending = await ethers.getContractAt("LendingPoolImpl", await proxy.getAddress());
  await lending.grantPauser(await deployer.getAddress());
  const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator");
  const configurator = await PoolConfigurator.deploy(await proxy.getAddress(), await deployer.getAddress());
  await configurator.waitForDeployment();
  await lending.setConfigurator(await configurator.getAddress());
  const AToken = await ethers.getContractFactory("AToken");
  const aToken = await AToken.deploy("aUSD8", "aUSD8", 18, await proxy.getAddress());
  await aToken.waitForDeployment();
  const VariableDebtToken = await ethers.getContractFactory("VariableDebtToken");
  const variableDebtToken = await VariableDebtToken.deploy("vdUSD8", "vdUSD8", 18, await proxy.getAddress());
  await variableDebtToken.waitForDeployment();
  await lending.setAToken(await aToken.getAddress());
  await lending.setVariableDebtToken(await variableDebtToken.getAddress());
  await usd8.transfer(user.address, ethers.parseUnits("1000000", 18));
  return { user, usd8, lending };
}

function randomAmount(min: number, max: number): bigint {
  const range = max - min + 1;
  const value = min + Math.floor(Math.random() * range);
  return ethers.parseUnits(String(value), 18);
}

const KNOWN_REVERT_PHRASES = [
  "Amount must be greater than 0",
  "Exceeds borrowing limit",
  "Withdrawal would make position unhealthy",
  "Insufficient liquidity",
  "Amount exceeds borrow",
  "Insufficient supply",
  "Exceeds borrowing limit",
  "not liquidatable",
  "exceeds closeFactor",
];

describe("Fuzz (P8)", function () {
  this.timeout(180_000);

  it(`supply/borrow/repay/withdraw random amounts ${FUZZ_ITERATIONS} iterations`, async function () {
    const { user, usd8, lending } = await deployMinimal();
    const poolAddr = await lending.getAddress();
    let unexpectedErrors = 0;

    for (let i = 0; i < FUZZ_ITERATIONS; i++) {
      const supplyAmt = randomAmount(1, 500);
      const borrowPct = Math.min(75, Math.floor(Math.random() * 76) + 1);
      const borrowAmt = (supplyAmt * BigInt(borrowPct)) / 100n;

      try {
        await usd8.connect(user).approve(poolAddr, supplyAmt);
        await lending.connect(user).supply(supplyAmt);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!KNOWN_REVERT_PHRASES.some((p) => msg.includes(p))) unexpectedErrors++;
        continue;
      }

      try {
        await lending.connect(user).borrow(borrowAmt);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!KNOWN_REVERT_PHRASES.some((p) => msg.includes(p))) unexpectedErrors++;
        try {
          await lending.connect(user).withdraw(supplyAmt);
        } catch {
          /* unwind best-effort */
        }
        continue;
      }

      try {
        await usd8.connect(user).approve(poolAddr, borrowAmt);
        await lending.connect(user).repay(borrowAmt);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!KNOWN_REVERT_PHRASES.some((p) => msg.includes(p))) unexpectedErrors++;
      }

      try {
        await lending.connect(user).withdraw(supplyAmt);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!KNOWN_REVERT_PHRASES.some((p) => msg.includes(p))) unexpectedErrors++;
      }
    }

    expect(unexpectedErrors).to.eq(0);
  });
});
