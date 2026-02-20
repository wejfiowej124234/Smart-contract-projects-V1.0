/**
 * P8 / 06: Liquidation bot entry. Deploys pool + liquidation, creates one liquidatable position,
 * then sends liquidationCall. Run: npx hardhat run liquidation-bot/run.ts
 * On localhost: ensure node is running and deploy first, or run with default network (in-process).
 */
import hre from "hardhat";

async function main(): Promise<void> {
  const [deployer, user] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const usd8 = await TestToken.deploy("USD8", "USD8");
  await usd8.waitForDeployment();
  const usd8Address = await usd8.getAddress();

  const LinearRateStrategy = await hre.ethers.getContractFactory("LinearRateStrategy");
  const strategy = await LinearRateStrategy.deploy();
  await strategy.waitForDeployment();

  const LendingPoolImpl = await hre.ethers.getContractFactory("LendingPoolImpl");
  const impl = await LendingPoolImpl.deploy();
  await impl.waitForDeployment();
  const proxyAdminArtifact = await hre.artifacts.readArtifact("ProxyAdmin");
  const abiWithCtor = [
    {
      type: "constructor" as const,
      inputs: [{ name: "initialOwner", type: "address", internalType: "address" }],
    },
    ...(proxyAdminArtifact.abi as object[]),
  ];
  const ProxyAdminFactory = new hre.ethers.ContractFactory(
    abiWithCtor,
    proxyAdminArtifact.bytecode,
    deployer,
  );
  const proxyAdmin = await ProxyAdminFactory.deploy(deployerAddress);
  await proxyAdmin.waitForDeployment();
  const initData = LendingPoolImpl.interface.encodeFunctionData("initialize", [
    usd8Address,
    deployerAddress,
    await strategy.getAddress(),
    deployerAddress,
  ]);
  const TransparentUpgradeableProxy = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy",
    deployer,
  );
  const proxy = await TransparentUpgradeableProxy.deploy(
    await impl.getAddress(),
    await proxyAdmin.getAddress(),
    initData,
  );
  await proxy.waitForDeployment();
  const poolAddress = await proxy.getAddress();
  const lending = await hre.ethers.getContractAt("LendingPoolImpl", poolAddress);

  await lending.grantPauser(deployerAddress);
  const PoolConfigurator = await hre.ethers.getContractFactory("PoolConfigurator", deployer);
  const configurator = await PoolConfigurator.deploy(poolAddress, deployerAddress);
  await configurator.waitForDeployment();
  await lending.setConfigurator(await configurator.getAddress());

  const AToken = await hre.ethers.getContractFactory("AToken", deployer);
  const aToken = await AToken.deploy("aUSD8", "aUSD8", 18, poolAddress);
  await aToken.waitForDeployment();
  const VariableDebtToken = await hre.ethers.getContractFactory("VariableDebtToken", deployer);
  const variableDebtToken = await VariableDebtToken.deploy("vdUSD8", "vdUSD8", 18, poolAddress);
  await variableDebtToken.waitForDeployment();
  await lending.setAToken(await aToken.getAddress());
  await lending.setVariableDebtToken(await variableDebtToken.getAddress());

  const Liquidation = await hre.ethers.getContractFactory("Liquidation", deployer);
  const liquidation = await Liquidation.deploy(poolAddress);
  await liquidation.waitForDeployment();
  await lending.setLiquidationContract(await liquidation.getAddress());

  const supplyAmt = hre.ethers.parseUnits("100", 18);
  const borrowAmt = hre.ethers.parseUnits("81", 18);
  await usd8.transfer(user.address, supplyAmt + borrowAmt);

  await configurator.setLTV(usd8Address, 81);
  await usd8.connect(user).approve(poolAddress, supplyAmt);
  await lending.connect(user).supply(supplyAmt);
  await lending.connect(user).borrow(borrowAmt);

  const liquidatable = await lending.isLiquidatable(user.address);
  if (!liquidatable) {
    console.log("[liquidation-bot] Position not liquidatable (unexpected); exiting 1");
    process.exitCode = 1;
    return;
  }

  const repayAmount = hre.ethers.parseUnits("40", 18);
  await usd8.connect(deployer).approve(poolAddress, repayAmount);
  const tx = await liquidation.connect(deployer).liquidationCall(user.address, repayAmount);
  await tx.wait();

  const [, borrowedAfter] = await lending.getUserPosition(user.address);
  console.log("[liquidation-bot] liquidationCall succeeded; borrower debt after:", borrowedAfter.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
