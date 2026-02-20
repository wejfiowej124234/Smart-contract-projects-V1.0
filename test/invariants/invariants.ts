/**
 * P8: Invariant tests. Total aToken supply = Pool total supply; total debt = Pool total borrow;
 * after any operation totalSupply >= totalBorrow; after liquidation HF >= threshold (or debt reduced).
 */
import { expect } from "chai";
import { ethers, artifacts } from "hardhat";

async function deployFull() {
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
  await usd8.transfer(user.address, ethers.parseUnits("10000", 18));
  const Liquidation = await ethers.getContractFactory("Liquidation");
  const liquidation = await Liquidation.deploy(await proxy.getAddress());
  await liquidation.waitForDeployment();
  await lending.setLiquidationContract(await liquidation.getAddress());
  return { deployer, user, usd8, lending, aToken, variableDebtToken, configurator, liquidation };
}

describe("Invariants (P8)", function () {
  it("totalSupply >= totalBorrow after supply/borrow/repay/withdraw", async function () {
    const { user, usd8, lending } = await deployFull();
    const poolAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("50", 18);
    await usd8.connect(user).approve(poolAddr, supplyAmt);
    await lending.connect(user).supply(supplyAmt);
    let [ts, tb] = await lending.getPoolInfo();
    expect(ts).to.gte(tb);

    await lending.connect(user).borrow(borrowAmt);
    [ts, tb] = await lending.getPoolInfo();
    expect(ts).to.gte(tb);

    await usd8.connect(user).approve(poolAddr, borrowAmt);
    await lending.connect(user).repay(borrowAmt);
    [ts, tb] = await lending.getPoolInfo();
    expect(ts).to.gte(tb);

    await lending.connect(user).withdraw(supplyAmt);
    [ts, tb] = await lending.getPoolInfo();
    expect(ts).to.gte(tb);
  });

  it("aToken totalSupply == Pool totalSupply; variableDebtToken totalSupply == Pool totalBorrow", async function () {
    const { user, usd8, lending, aToken, variableDebtToken } = await deployFull();
    const poolAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("40", 18);
    await usd8.connect(user).approve(poolAddr, supplyAmt);
    await lending.connect(user).supply(supplyAmt);
    await lending.connect(user).borrow(borrowAmt);

    const [poolTs, poolTb] = await lending.getPoolInfo();
    expect(await aToken.totalSupply()).to.eq(poolTs);
    expect(await variableDebtToken.totalSupply()).to.eq(poolTb);
  });

  it("after liquidation totalSupply >= totalBorrow and HF >= 100 or debt reduced", async function () {
    const { deployer, user, usd8, lending, configurator, liquidation } = await deployFull();
    const poolAddr = await lending.getAddress();
    const usd8Address = await usd8.getAddress();
    await configurator.setLTV(usd8Address, 81);
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("81", 18);
    await usd8.connect(user).approve(poolAddr, supplyAmt);
    await lending.connect(user).supply(supplyAmt);
    await lending.connect(user).borrow(borrowAmt);
    expect(await lending.isLiquidatable(user.address)).to.eq(true);

    const repayAmount = ethers.parseUnits("40", 18);
    await usd8.connect(deployer).approve(poolAddr, repayAmount);
    await liquidation.connect(deployer).liquidationCall(user.address, repayAmount);

    const [ts, tb] = await lending.getPoolInfo();
    expect(ts).to.gte(tb);
    const [, , , hf] = await lending.getUserPosition(user.address);
    expect(hf).to.gte(100n);
  });
});
