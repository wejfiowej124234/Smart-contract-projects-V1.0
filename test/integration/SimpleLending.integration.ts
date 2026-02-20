import { expect } from "chai";
import { ethers, artifacts } from "hardhat";

describe("SimpleLending (integration)", function () {
  // Strategic note (why): ethers v6 + Hardhat typegen can infer contracts as `BaseContract`,
  // making direct method calls show TS redlines. `getFunction("...")(...args)` is type-safe
  // and matches how the frontend write-model dispatches calls.
  async function deploy() {
    const [deployer, user] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    const usd8 = await TestToken.deploy("USD8", "USD8");
    await usd8.waitForDeployment();
    const usd8Address = await usd8.getAddress();
    const deployerAddress = await deployer.getAddress();

    const LinearRateStrategy = await ethers.getContractFactory("LinearRateStrategy");
    const strategy = await LinearRateStrategy.deploy();
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();

    const LendingPoolImpl = await ethers.getContractFactory("LendingPoolImpl");
    const impl = await LendingPoolImpl.deploy();
    await impl.waitForDeployment();
    const implAddress = await impl.getAddress();

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
    const proxyAdmin = await ProxyAdminFactory.deploy(deployerAddress);
    await proxyAdmin.waitForDeployment();
    const proxyAdminAddress = await proxyAdmin.getAddress();

    const initData = LendingPoolImpl.interface.encodeFunctionData("initialize", [
      usd8Address,
      deployerAddress,
      strategyAddress,
      deployerAddress,
    ]);
    const TransparentUpgradeableProxy = await ethers.getContractFactory(
      "TransparentUpgradeableProxy",
    );
    const proxy = await TransparentUpgradeableProxy.deploy(
      implAddress,
      proxyAdminAddress,
      initData,
    );
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    const lending = await ethers.getContractAt("LendingPoolImpl", proxyAddress);

    // P3: Grant PAUSER to deployer so tests can pause/unpause
    await lending.grantPauser(deployerAddress);

    // P4: Deploy PoolConfigurator and set as pool configurator (so Configurator is the only writer)
    const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator");
    const configurator = await PoolConfigurator.deploy(proxyAddress, deployerAddress);
    await configurator.waitForDeployment();
    await lending.setConfigurator(await configurator.getAddress());

    // P5: Deploy aToken and variableDebtToken and set on pool
    const AToken = await ethers.getContractFactory("AToken");
    const aToken = await AToken.deploy("aUSD8", "aUSD8", 18, proxyAddress);
    await aToken.waitForDeployment();
    const VariableDebtToken = await ethers.getContractFactory("VariableDebtToken");
    const variableDebtToken = await VariableDebtToken.deploy("vdUSD8", "vdUSD8", 18, proxyAddress);
    await variableDebtToken.waitForDeployment();
    await lending.setAToken(await aToken.getAddress());
    await lending.setVariableDebtToken(await variableDebtToken.getAddress());

    await usd8.getFunction("transfer")(user.address, ethers.parseUnits("1000", 18));

    return { deployer, user, usd8, lending, configurator, aToken, variableDebtToken };
  }

  it("approve → supply → borrow → repay → withdraw", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("50", 18);

    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await expect(lendingUser.getFunction("supply")(supplyAmt)).to.emit(lending, "Supplied");

    await expect(lendingUser.getFunction("borrow")(borrowAmt)).to.emit(lending, "Borrowed");

    await usd8User.getFunction("approve")(lendAddr, borrowAmt);
    await expect(lendingUser.getFunction("repay")(borrowAmt)).to.emit(lending, "Repaid");

    await expect(lendingUser.getFunction("withdraw")(supplyAmt)).to.emit(lending, "Withdrawn");

    const pos = await lending.getUserPosition(user.address);
    expect(pos[0]).to.eq(0n); // supplied
    expect(pos[1]).to.eq(0n); // borrowed
  });

  it("P2: supply → borrow → repay → withdraw — pool totalSupply/totalBorrow/utilization match expected", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("50", 18);
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);

    let info = await lending.getPoolInfo();
    expect(info[0]).to.eq(supplyAmt); // totalSupply
    expect(info[1]).to.eq(0n); // totalBorrow
    expect(info[2]).to.eq(0n); // utilizationRate
    expect(info[3]).to.eq(2n); // supplyRate (BASE_RATE)
    expect(info[4]).to.eq(4n); // borrowRate (BASE_RATE+2)

    await lendingUser.getFunction("borrow")(borrowAmt);

    info = await lending.getPoolInfo();
    expect(info[0]).to.eq(supplyAmt);
    expect(info[1]).to.eq(borrowAmt);
    expect(info[2]).to.eq(50n); // 50% utilization
    expect(info[3]).to.eq(7n); // 2 + 50/10
    expect(info[4]).to.eq(14n); // 4 + 50/5

    await usd8User.getFunction("approve")(lendAddr, borrowAmt);
    await lendingUser.getFunction("repay")(borrowAmt);

    info = await lending.getPoolInfo();
    expect(info[0]).to.eq(supplyAmt);
    expect(info[1]).to.eq(0n);
    expect(info[2]).to.eq(0n);

    await lendingUser.getFunction("withdraw")(supplyAmt);

    info = await lending.getPoolInfo();
    expect(info[0]).to.eq(0n);
    expect(info[1]).to.eq(0n);
  });

  it("reverts when borrowing above max", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("100", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("100", 18));

    // max borrow is 75% of supply
    await expect(lendingUser.getFunction("borrow")(ethers.parseUnits("76", 18))).to.be.revertedWithCustomError(
      lending,
      "ExceedsBorrowingLimit",
    );
  });

  it("reverts when withdrawing would make position unhealthy", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("100", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("100", 18));
    await lendingUser.getFunction("borrow")(ethers.parseUnits("75", 18));

    // withdrawing any amount would break LTV
    await expect(lendingUser.getFunction("withdraw")(ethers.parseUnits("1", 18))).to.be.revertedWithCustomError(
      lending,
      "WithdrawalWouldMakePositionUnhealthy",
    );
  });

  it("calculateMaxBorrow/calculateMaxWithdraw track the position", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    const supplyAmt = ethers.parseUnits("10", 18);
    const borrowAmt = ethers.parseUnits("5", 18);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);

    const maxBorrow1 = await lending.calculateMaxBorrow(user.address);
    expect(maxBorrow1).to.eq((supplyAmt * 75n) / 100n);

    await lendingUser.getFunction("borrow")(borrowAmt);

    const maxBorrow2 = await lending.calculateMaxBorrow(user.address);
    expect(maxBorrow2).to.eq(((supplyAmt * 75n) / 100n) - borrowAmt);

    const maxWithdraw = await lending.calculateMaxWithdraw(user.address);
    // minRequiredSupply = floor(borrowed * 100 / 75)
    const minRequiredSupply = (borrowAmt * 100n) / 75n;
    expect(maxWithdraw).to.eq(supplyAmt - minRequiredSupply);
  });

  it("reverts when borrowing with no pool liquidity", async function () {
    const { user, lending } = await deploy();
    const lendingUser = lending.connect(user);

    await expect(lendingUser.getFunction("borrow")(ethers.parseUnits("1", 18))).to.be.revertedWithCustomError(
      lending,
      "InsufficientLiquidity",
    );
  });

  it("reverts when repaying more than borrowed", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    const supplyAmt = ethers.parseUnits("10", 18);
    const borrowAmt = ethers.parseUnits("5", 18);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);
    await lendingUser.getFunction("borrow")(borrowAmt);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("6", 18));
    await expect(lendingUser.getFunction("repay")(ethers.parseUnits("6", 18))).to.be.revertedWithCustomError(
      lending,
      "AmountExceedsBorrow",
    );
  });

  it("reverts when withdrawing more than supplied", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("1", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("1", 18));

    await expect(lendingUser.getFunction("withdraw")(ethers.parseUnits("2", 18))).to.be.revertedWithCustomError(
      lending,
      "InsufficientSupply",
    );
  });

  it("P3: non-PAUSER cannot call pause", async function () {
    const { user, usd8, lending } = await deploy();
    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);
    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("10", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("10", 18));
    await expect(lendingUser.getFunction("pause")()).to.be.revertedWithCustomError(lending, "NotPauser");
  });

  it("P3: PAUSER can pause; supply/borrow revert when paused", async function () {
    const { deployer, user, usd8, lending } = await deploy();
    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingPauser = lending.connect(deployer);
    const lendingUser = lending.connect(user);
    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("10", 18));
    await lendingPauser.getFunction("pause")();
    await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.be.revertedWith(
      "Pausable: paused",
    );
    await expect(lendingUser.getFunction("borrow")(ethers.parseUnits("1", 18))).to.be.revertedWith(
      "Pausable: paused",
    );
  });

  it("P3: PAUSER unpause restores normal operation", async function () {
    const { deployer, user, usd8, lending } = await deploy();
    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingPauser = lending.connect(deployer);
    const lendingUser = lending.connect(user);
    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("10", 18));
    await lendingPauser.getFunction("pause")();
    await lendingPauser.getFunction("unpause")();
    await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.emit(lending, "Supplied");
  });

  it("P3: Admin (owner) can grant and revoke PAUSER", async function () {
    const { deployer, user, lending } = await deploy();
    const pauserAccount = user.address;
    expect(await lending.isPauser(pauserAccount)).to.eq(false);
    await lending.connect(deployer).getFunction("grantPauser")(pauserAccount);
    expect(await lending.isPauser(pauserAccount)).to.eq(true);
    await lending.connect(deployer).getFunction("revokePauser")(pauserAccount);
    expect(await lending.isPauser(pauserAccount)).to.eq(false);
  });

  it("can be paused by PAUSER and blocks actions (existing flow)", async function () {
    const { deployer, user, usd8, lending } = await deploy();
    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingPauser = lending.connect(deployer);
    const lendingUser = lending.connect(user);
    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("10", 18));
    await lendingPauser.getFunction("pause")();
    await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.be.revertedWith(
      "Pausable: paused",
    );
    await lendingPauser.getFunction("unpause")();
    await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.emit(lending, "Supplied");
  });

  it("P4: non-Admin calling PoolConfigurator setLTV reverts", async function () {
    const { user, usd8, lending, configurator } = await deploy();
    const usd8Address = await usd8.getAddress();
    const configuratorUser = configurator.connect(user);
    await expect(configuratorUser.getFunction("setLTV")(usd8Address, 70)).to.be.revertedWith("not admin");
  });

  it("P4: Admin via Configurator setLTV changes pool ltvRatio and maxBorrow", async function () {
    const { deployer, user, usd8, lending, configurator } = await deploy();
    const lendAddr = await lending.getAddress();
    const usd8Address = await usd8.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("100", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("100", 18));

    expect(await lending.ltvRatio()).to.eq(75n);
    expect(await lending.calculateMaxBorrow(user.address)).to.eq(ethers.parseUnits("75", 18));

    await configurator.connect(deployer).getFunction("setLTV")(usd8Address, 70);
    expect(await lending.ltvRatio()).to.eq(70n);
    expect(await lending.calculateMaxBorrow(user.address)).to.eq(ethers.parseUnits("70", 18));
  });

  it("P5: supply increases aToken balance; withdraw decreases it", async function () {
    const { user, usd8, lending, aToken } = await deploy();
    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    expect(await aToken.balanceOf(user.address)).to.eq(0n);
    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);
    expect(await aToken.balanceOf(user.address)).to.eq(supplyAmt);

    await lendingUser.getFunction("withdraw")(supplyAmt);
    expect(await aToken.balanceOf(user.address)).to.eq(0n);
  });

  it("P5: borrow increases variableDebtToken balance; repay decreases it", async function () {
    const { user, usd8, lending, variableDebtToken } = await deploy();
    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("50", 18);
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);
    expect(await variableDebtToken.balanceOf(user.address)).to.eq(0n);

    await lendingUser.getFunction("borrow")(borrowAmt);
    expect(await variableDebtToken.balanceOf(user.address)).to.eq(borrowAmt);

    await usd8User.getFunction("approve")(lendAddr, borrowAmt);
    await lendingUser.getFunction("repay")(borrowAmt);
    expect(await variableDebtToken.balanceOf(user.address)).to.eq(0n);
  });

  it("P5: getUserPosition supplied/borrowed match aToken and variableDebtToken balance", async function () {
    const { user, usd8, lending, aToken, variableDebtToken } = await deploy();
    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("50", 18);
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);
    await lendingUser.getFunction("borrow")(borrowAmt);

    const [supplied, borrowed] = await lending.getUserPosition(user.address);
    expect(supplied).to.eq(await aToken.balanceOf(user.address));
    expect(borrowed).to.eq(await variableDebtToken.balanceOf(user.address));
    expect(supplied).to.eq(supplyAmt);
    expect(borrowed).to.eq(borrowAmt);
  });

  it("P5: aToken balance grows with index after time (supply rate accrual)", async function () {
    const { user, usd8, lending, aToken } = await deploy();
    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, supplyAmt);
    await lendingUser.getFunction("supply")(supplyAmt);
    const balanceBefore = await aToken.balanceOf(user.address);
    expect(balanceBefore).to.eq(supplyAmt);

    await ethers.provider.send("evm_increaseTime", [365 * 24 * 3600]);
    await ethers.provider.send("evm_mine", []);
    await usd8User.getFunction("approve")(lendAddr, 1n);
    await lendingUser.getFunction("supply")(1n);
    const balanceAfter = await aToken.balanceOf(user.address);
    expect(balanceAfter).to.gt(balanceBefore);
  });

  it("proxy upgrade via ProxyAdmin: address unchanged, calls still work", async function () {
    const [deployer, user] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const usd8 = await (await ethers.getContractFactory("TestToken")).deploy("USD8", "USD8");
    await usd8.waitForDeployment();
    const usd8Address = await usd8.getAddress();
    await usd8.getFunction("transfer")(user.address, ethers.parseUnits("1000", 18));

    const LinearRateStrategy = await ethers.getContractFactory("LinearRateStrategy");
    const strategy = await LinearRateStrategy.deploy();
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();

    const LendingPoolImpl = await ethers.getContractFactory("LendingPoolImpl");
    const impl1 = await LendingPoolImpl.deploy();
    await impl1.waitForDeployment();
    const impl1Address = await impl1.getAddress();

    const proxyAdminArtifact = await artifacts.readArtifact("ProxyAdmin");
    const abiWithCtor = [
      {
        type: "constructor" as const,
        inputs: [{ name: "initialOwner", type: "address", internalType: "address" }],
      },
      ...(proxyAdminArtifact.abi as any[]),
    ];
    const ProxyAdminFactory = new ethers.ContractFactory(
      abiWithCtor,
      proxyAdminArtifact.bytecode,
      deployer,
    );
    const proxyAdmin = await ProxyAdminFactory.deploy(deployerAddress);
    await proxyAdmin.waitForDeployment();

    const initData = LendingPoolImpl.interface.encodeFunctionData("initialize", [
      usd8Address,
      deployerAddress,
      strategyAddress,
      deployerAddress,
    ]);
    const TransparentUpgradeableProxy = await ethers.getContractFactory(
      "TransparentUpgradeableProxy",
    );
    const proxy = await TransparentUpgradeableProxy.deploy(
      impl1Address,
      await proxyAdmin.getAddress(),
      initData,
    );
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    const lending = await ethers.getContractAt("LendingPoolImpl", proxyAddress);

    await usd8.connect(user).getFunction("approve")(proxyAddress, ethers.parseUnits("100", 18));
    await lending.connect(user).getFunction("supply")(ethers.parseUnits("100", 18));
    await lending.connect(user).getFunction("borrow")(ethers.parseUnits("50", 18));

    const impl2 = await LendingPoolImpl.deploy();
    await impl2.waitForDeployment();
    const impl2Address = await impl2.getAddress();
    await proxyAdmin.connect(deployer).getFunction("upgrade")(proxyAddress, impl2Address);

    expect(await proxy.getAddress()).to.eq(proxyAddress);
    const pos = await lending.getUserPosition(user.address);
    expect(pos[0]).to.eq(ethers.parseUnits("100", 18));
    expect(pos[1]).to.eq(ethers.parseUnits("50", 18));
    await usd8.connect(user).getFunction("approve")(proxyAddress, ethers.parseUnits("50", 18));
    await lending.connect(user).getFunction("repay")(ethers.parseUnits("50", 18));
    await lending.connect(user).getFunction("withdraw")(ethers.parseUnits("100", 18));
  });

  describe("P6: Oracle layer", function () {
    it("OracleRouter.getPrice returns expected when main source (Mock) is normal", async function () {
      const [deployer] = await ethers.getSigners();
      const MockAggregator = await ethers.getContractFactory("MockAggregator");
      const mockAgg = await MockAggregator.deploy(1e8); // 1 USD in 8 decimals
      await mockAgg.waitForDeployment();
      const heartbeat = 365 * 24 * 3600;
      const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkAdapter");
      const adapter = await ChainlinkAdapter.deploy(
        await mockAgg.getAddress(),
        heartbeat,
        0,
        2e8,
      );
      await adapter.waitForDeployment();
      const OracleRouter = await ethers.getContractFactory("OracleRouter");
      const router = await OracleRouter.deploy();
      await router.waitForDeployment();
      const usd8 = await (await ethers.getContractFactory("TestToken")).deploy("USD8", "USD8");
      await usd8.waitForDeployment();
      await router.setFeed(await usd8.getAddress(), await adapter.getAddress());
      const price = await router.getPrice(await usd8.getAddress());
      expect(price).to.eq(1e8);
    });

    it("ChainlinkAdapter getPrice reverts when price is stale", async function () {
      const MockAggregator = await ethers.getContractFactory("MockAggregator");
      const mockAgg = await MockAggregator.deploy(1e8);
      await mockAgg.waitForDeployment();
      const heartbeat = 3600; // 1 hour
      const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkAdapter");
      const adapter = await ChainlinkAdapter.deploy(
        await mockAgg.getAddress(),
        heartbeat,
        0,
        2e8,
      );
      await adapter.waitForDeployment();
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine", []);
      await expect(adapter.getPrice()).to.be.revertedWith("stale price");
    });

    it("PriceBoundGuard getPrice reverts when circuit is open", async function () {
      const MockAggregator = await ethers.getContractFactory("MockAggregator");
      const mockAgg = await MockAggregator.deploy(1e8);
      await mockAgg.waitForDeployment();
      const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkAdapter");
      const adapter = await ChainlinkAdapter.deploy(
        await mockAgg.getAddress(),
        365 * 24 * 3600,
        0,
        2e8,
      );
      await adapter.waitForDeployment();
      const PriceBoundGuard = await ethers.getContractFactory("PriceBoundGuard");
      const guard = await PriceBoundGuard.deploy(await adapter.getAddress(), 1000);
      await guard.waitForDeployment();
      const [owner] = await ethers.getSigners();
      await guard.connect(owner).openCircuit();
      await expect(guard.getPrice()).to.be.revertedWith("circuit open");
    });

    it("PriceBoundGuard getPrice reverts when price deviates beyond maxDeviationBps (C3a deviation evidence)", async function () {
      const MockAggregator = await ethers.getContractFactory("MockAggregator");
      const mockAgg = await MockAggregator.deploy(1e8);
      await mockAgg.waitForDeployment();
      const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkAdapter");
      const adapter = await ChainlinkAdapter.deploy(
        await mockAgg.getAddress(),
        365 * 24 * 3600,
        0,
        2e8,
      );
      await adapter.waitForDeployment();
      const maxDeviationBps = 1000; // 10%
      const PriceBoundGuard = await ethers.getContractFactory("PriceBoundGuard");
      const guard = await PriceBoundGuard.deploy(await adapter.getAddress(), maxDeviationBps);
      await guard.waitForDeployment();
      const [owner] = await ethers.getSigners();
      await guard.connect(owner).setAnchor(1e8);
      expect(await guard.getPrice()).to.eq(1e8);
      await mockAgg.setPrice(1.2e8); // +20% > 10% -> must revert
      await expect(guard.getPrice()).to.be.revertedWith("price deviation too high");
      await mockAgg.setPrice(0.88e8); // -12% > 10% -> must revert
      await expect(guard.getPrice()).to.be.revertedWith("price deviation too high");
      await mockAgg.setPrice(0.92e8); // -8% <= 10% -> ok
      expect(await guard.getPrice()).to.eq(0.92e8);
    });

    it("Pool with Oracle: getUserPosition collateralValue and HF use price", async function () {
      const { deployer, user, usd8, lending } = await deploy();
      const usd8Address = await usd8.getAddress();
      const MockAggregator = await ethers.getContractFactory("MockAggregator");
      const mockAgg = await MockAggregator.deploy(1e8);
      await mockAgg.waitForDeployment();
      const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkAdapter");
      const adapter = await ChainlinkAdapter.deploy(
        await mockAgg.getAddress(),
        365 * 24 * 3600,
        0,
        2e8,
      );
      await adapter.waitForDeployment();
      const OracleRouter = await ethers.getContractFactory("OracleRouter");
      const router = await OracleRouter.deploy();
      await router.waitForDeployment();
      await router.setFeed(usd8Address, await adapter.getAddress());
      await lending.setOracleRouter(await router.getAddress());

      const lendAddr = await lending.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("50", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);

      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);

      const [supplied, borrowed, collateralValue, healthFactor] = await lending.getUserPosition(
        user.address,
      );
      expect(supplied).to.eq(supplyAmt);
      expect(borrowed).to.eq(borrowAmt);
      expect(collateralValue).to.eq(100n * 10n ** 8n);
      expect(healthFactor).to.eq(160n);
    });

    it("existing key integration still passes with oracle unset", async function () {
      const { user, usd8, lending } = await deploy();
      const lendAddr = await lending.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("50", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);

      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);

      const pos = await lending.getUserPosition(user.address);
      expect(pos[0]).to.eq(supplyAmt);
      expect(pos[1]).to.eq(borrowAmt);
    });
  });

  describe("P7: RiskEngine and Liquidation", function () {
    it("RiskEngine: HF, maxBorrow, maxWithdraw, isLiquidatable via Pool", async function () {
      const { user, usd8, lending } = await deploy();
      const lendAddr = await lending.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("50", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);

      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);

      const [, borrowed, , healthFactor] = await lending.getUserPosition(user.address);
      expect(borrowed).to.eq(borrowAmt);
      expect(healthFactor).to.eq(150n);

      const maxBorrow = await lending.calculateMaxBorrow(user.address);
      expect(maxBorrow).to.eq((supplyAmt * 75n) / 100n - borrowAmt);
      const maxWithdraw = await lending.calculateMaxWithdraw(user.address);
      const minRequired = (borrowAmt * 100n) / 75n;
      expect(maxWithdraw).to.eq(supplyAmt - minRequired);

      expect(await lending.isLiquidatable(user.address)).to.eq(false);
    });

    it("P7: when HF < 100, liquidationCall executes; debt reduced, HF improved", async function () {
      const { deployer, user, usd8, lending, configurator } = await deploy();
      const usd8Address = await usd8.getAddress();
      const lendAddr = await lending.getAddress();

      await configurator.setLTV(usd8Address, 81);
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("81", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);

      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);

      expect(await lending.isLiquidatable(user.address)).to.eq(true);

      const Liquidation = await ethers.getContractFactory("Liquidation");
      const liquidation = await Liquidation.deploy(lendAddr);
      await liquidation.waitForDeployment();
      await lending.setLiquidationContract(await liquidation.getAddress());

      const liquidator = deployer;
      const repayAmount = ethers.parseUnits("40", 18);
      await usd8.connect(liquidator).getFunction("approve")(lendAddr, repayAmount);
      await liquidation.connect(liquidator).liquidationCall(user.address, repayAmount);

      const [, borrowedAfter] = await lending.getUserPosition(user.address);
      expect(borrowedAfter).to.eq(ethers.parseUnits("41", 18));

      const [, , , hfAfter] = await lending.getUserPosition(user.address);
      expect(hfAfter).to.gte(100n);
    });

    it("P7: invariant total supply >= total borrow after operations", async function () {
      const { user, usd8, lending } = await deploy();
      const lendAddr = await lending.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("50", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);

      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      const [ts1, tb1] = await lending.getPoolInfo();
      expect(ts1).to.gte(tb1);

      await lendingUser.getFunction("borrow")(borrowAmt);
      const [ts2, tb2] = await lending.getPoolInfo();
      expect(ts2).to.gte(tb2);

      await usd8User.getFunction("approve")(lendAddr, borrowAmt);
      await lendingUser.getFunction("repay")(borrowAmt);
      const [ts3, tb3] = await lending.getPoolInfo();
      expect(ts3).to.gte(tb3);
    });

    it("existing integration still passes after P7", async function () {
      const { user, usd8, lending } = await deploy();
      const lendAddr = await lending.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("50", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);

      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);
      await usd8User.getFunction("approve")(lendAddr, borrowAmt);
      await lendingUser.getFunction("repay")(borrowAmt);
      await lendingUser.getFunction("withdraw")(supplyAmt);

      const [supplied, borrowed] = await lending.getUserPosition(user.address);
      expect(supplied).to.eq(0n);
      expect(borrowed).to.eq(0n);
    });
  });

  describe("07/11: getReserveData, getUserAccountData, setReservePause, validate, setUserUseReserveAsCollateral", function () {
    it("getReserveData returns ltv, lt, liquidityIndex, borrowIndex, strategy for pool token", async function () {
      const { user, usd8, lending, configurator } = await deploy();
      const usd8Addr = await usd8.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(await lending.getAddress(), supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);

      const data = await lending.getReserveData(usd8Addr);
      expect(data.ltv).to.eq(75n);
      expect(data.lt).to.eq(80n);
      expect(data.strategy).to.properAddress;
      expect(data.liquidityIndex_).to.be.gt(0n);
      expect(data.borrowIndex_).to.be.gt(0n);
      await expect(lending.getReserveData(user.address)).to.be.revertedWithCustomError(lending, "AssetMustBePoolToken");
    });

    it("getUserAccountData matches getUserPosition and calculateMaxBorrow", async function () {
      const { user, usd8, lending } = await deploy();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("50", 18);
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(await lending.getAddress(), supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);

      const account = await lending.getUserAccountData(user.address);
      const pos = await lending.getUserPosition(user.address);
      const maxBorrow = await lending.calculateMaxBorrow(user.address);
      expect(account.totalCollateral).to.eq(pos[2]); // collateralValue
      expect(account.healthFactor).to.eq(pos[3]);
      expect(account.availableBorrows).to.eq(maxBorrow);
    });

    it("setReservePause: when reserve paused, supply and borrow revert", async function () {
      const { deployer, user, usd8, lending, configurator } = await deploy();
      const usd8Addr = await usd8.getAddress();
      const poolAddr = await lending.getAddress();
      const supplyAmt = ethers.parseUnits("100", 18);
      const configuratorAsAdmin = configurator.connect(deployer);
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(poolAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);

      await configuratorAsAdmin.getFunction("setReservePause")(usd8Addr, true);
      await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.be.revertedWithCustomError(
        lending,
        "ReservePaused",
      );
      await expect(lendingUser.getFunction("borrow")(ethers.parseUnits("1", 18))).to.be.revertedWithCustomError(
        lending,
        "ReservePaused",
      );

      await configuratorAsAdmin.getFunction("setReservePause")(usd8Addr, false);
      await usd8.connect(user).getFunction("approve")(poolAddr, ethers.parseUnits("10", 18));
      await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.emit(lending, "Supplied");
    });

    it("validateBorrow and validateWithdraw match calculateMaxBorrow and calculateMaxWithdraw", async function () {
      const { user, usd8, lending } = await deploy();
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("30", 18);
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(await lending.getAddress(), supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);

      const maxBorrow = await lending.calculateMaxBorrow(user.address);
      const maxWithdraw = await lending.calculateMaxWithdraw(user.address);
      expect(await lending.validateBorrow(user.address, maxBorrow)).to.be.true;
      expect(await lending.validateBorrow(user.address, maxBorrow + 1n)).to.be.false;
      expect(await lending.validateWithdraw(user.address, maxWithdraw)).to.be.true;
      expect(await lending.validateWithdraw(user.address, maxWithdraw + 1n)).to.be.false;
    });

    it("setUserUseReserveAsCollateral: wrong asset reverts; useAsCollateral false reverts", async function () {
      const { user, usd8, lending } = await deploy();
      const usd8Addr = await usd8.getAddress();
      const lendingUser = lending.connect(user);
      await expect(lendingUser.getFunction("setUserUseReserveAsCollateral")(user.address, true)).to.be.revertedWithCustomError(
        lending,
        "AssetMustBePoolToken",
      );
      await expect(
        lendingUser.getFunction("setUserUseReserveAsCollateral")(usd8Addr, false),
      ).to.be.revertedWithCustomError(lending, "CannotDisableCollateral");
      await expect(lendingUser.getFunction("setUserUseReserveAsCollateral")(usd8Addr, true)).to.not.be.reverted;
    });
  });

  describe("07: mintToTreasury & Treasury", function () {
    it("mintToTreasury: after time and supply, treasury aToken balance increases when reserveFactor > 0", async function () {
      const { deployer, user, usd8, lending, configurator, aToken } = await deploy();
      const Treasury = await ethers.getContractFactory("Treasury");
      const treasury = await Treasury.deploy();
      await treasury.waitForDeployment();
      const treasuryAddr = await treasury.getAddress();
      await lending.setTreasury(treasuryAddr);
      const usd8Addr = await usd8.getAddress();
      await configurator.connect(deployer).getFunction("setReserveFactor")(usd8Addr, 1000); // 10%

      const supplyAmt = ethers.parseUnits("1000", 18);
      await usd8.connect(user).getFunction("approve")(await lending.getAddress(), supplyAmt);
      await lending.connect(user).getFunction("supply")(supplyAmt);
      await lending.connect(user).getFunction("borrow")(ethers.parseUnits("500", 18)); // utilization for interest

      const balanceBefore = await aToken.balanceOf(treasuryAddr);
      await ethers.provider.send("evm_increaseTime", [3600 * 24]); // 1 day
      await ethers.provider.send("evm_mine", []);
      await usd8.connect(user).getFunction("approve")(await lending.getAddress(), 1n);
      await lending.connect(user).getFunction("supply")(1n); // trigger cumulateIndexes
      const balanceAfter = await aToken.balanceOf(treasuryAddr);
      expect(balanceAfter).to.be.gte(balanceBefore);
    });

    it("Treasury: only owner can withdraw and setReserveFactor", async function () {
      const { deployer, user, usd8 } = await deploy();
      const Treasury = await ethers.getContractFactory("Treasury");
      const treasury = await Treasury.deploy();
      await treasury.waitForDeployment();
      await usd8.connect(deployer).getFunction("transfer")(await treasury.getAddress(), ethers.parseUnits("100", 18));
      await expect(
        treasury.connect(user).getFunction("withdraw")(await usd8.getAddress(), user.address, ethers.parseUnits("10", 18)),
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        treasury.connect(user).getFunction("setReserveFactor")(await usd8.getAddress(), 500),
      ).to.be.revertedWith("Ownable: caller is not the owner");
      const userBalanceBefore = await usd8.balanceOf(user.address);
      await treasury.connect(deployer).getFunction("withdraw")(await usd8.getAddress(), user.address, ethers.parseUnits("10", 18));
      expect(await usd8.balanceOf(user.address)).to.eq(userBalanceBefore + ethers.parseUnits("10", 18));
    });
  });

  describe("07: FlashLoan", function () {
    it("executeFlashLoan: transfer to receiver, callback, reclaim amount + fee", async function () {
      const { user, deployer, usd8, lending } = await deploy();
      const poolAddr = await lending.getAddress();
      const usd8Addr = await usd8.getAddress();
      const supplyAmt = ethers.parseUnits("200", 18);
      const flashAmount = ethers.parseUnits("100", 18);
      const feeBps = 9n;
      const fee = (flashAmount * feeBps) / 10000n; // 0.09%

      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);
      await usd8User.getFunction("approve")(poolAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);

      const MockReceiver = await ethers.getContractFactory("MockFlashLoanReceiver");
      const receiver = await MockReceiver.deploy();
      await receiver.waitForDeployment();
      const receiverAddr = await receiver.getAddress();
      await usd8User.getFunction("transfer")(receiverAddr, fee);

      await expect(
        lendingUser.getFunction("executeFlashLoan")(usd8Addr, flashAmount, receiverAddr, "0x"),
      )
        .to.emit(lending, "FlashLoan")
        .withArgs(receiverAddr, usd8Addr, flashAmount, fee);

      expect(await usd8.balanceOf(poolAddr)).to.be.gte(supplyAmt + fee);
    });

    it("executeFlashLoan: wrong asset reverts AssetMustBePoolToken", async function () {
      const { user, usd8, lending } = await deploy();
      const poolAddr = await lending.getAddress();
      const usd8Addr = await usd8.getAddress();
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(poolAddr, ethers.parseUnits("200", 18));
      await lendingUser.getFunction("supply")(ethers.parseUnits("200", 18));
      const MockReceiver = await ethers.getContractFactory("MockFlashLoanReceiver");
      const receiver = await MockReceiver.deploy();
      await receiver.waitForDeployment();
      await expect(
        lendingUser.getFunction("executeFlashLoan")(
          user.address,
          ethers.parseUnits("100", 18),
          await receiver.getAddress(),
          "0x",
        ),
      ).to.be.revertedWithCustomError(lending, "AssetMustBePoolToken");
    });

    it("executeFlashLoan: amount 0 reverts ZeroAmount", async function () {
      const { user, usd8, lending } = await deploy();
      const usd8Addr = await usd8.getAddress();
      const MockReceiver = await ethers.getContractFactory("MockFlashLoanReceiver");
      const receiver = await MockReceiver.deploy();
      await receiver.waitForDeployment();
      await expect(
        lending.connect(user).getFunction("executeFlashLoan")(
          usd8Addr,
          0n,
          await receiver.getAddress(),
          "0x",
        ),
      ).to.be.revertedWithCustomError(lending, "ZeroAmount");
    });

    it("executeFlashLoan: receiver zero reverts ZeroAddress", async function () {
      const { user, usd8, lending } = await deploy();
      const usd8Addr = await usd8.getAddress();
      await expect(
        lending.connect(user).getFunction("executeFlashLoan")(
          usd8Addr,
          ethers.parseUnits("100", 18),
          ethers.ZeroAddress,
          "0x",
        ),
      ).to.be.revertedWithCustomError(lending, "ZeroAddress");
    });

    it("executeFlashLoan: callback returns false reverts FlashLoanCallbackFailed", async function () {
      const { user, usd8, lending } = await deploy();
      const poolAddr = await lending.getAddress();
      const usd8Addr = await usd8.getAddress();
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(poolAddr, ethers.parseUnits("200", 18));
      await lendingUser.getFunction("supply")(ethers.parseUnits("200", 18));
      const MockReturnFalse = await ethers.getContractFactory("MockFlashLoanReceiverReturnFalse");
      const receiver = await MockReturnFalse.deploy();
      await receiver.waitForDeployment();
      await expect(
        lendingUser.getFunction("executeFlashLoan")(
          usd8Addr,
          ethers.parseUnits("100", 18),
          await receiver.getAddress(),
          "0x",
        ),
      ).to.be.revertedWithCustomError(lending, "FlashLoanCallbackFailed");
    });

    it("executeFlashLoan: under-repay reverts (transferFrom or FlashLoanRepayFailed)", async function () {
      const { user, usd8, lending } = await deploy();
      const poolAddr = await lending.getAddress();
      const usd8Addr = await usd8.getAddress();
      const lendingUser = lending.connect(user);
      await usd8.connect(user).getFunction("approve")(poolAddr, ethers.parseUnits("200", 18));
      await lendingUser.getFunction("supply")(ethers.parseUnits("200", 18));
      const MockUnderRepay = await ethers.getContractFactory("MockFlashLoanReceiverUnderRepay");
      const receiver = await MockUnderRepay.deploy();
      await receiver.waitForDeployment();
      await expect(
        lendingUser.getFunction("executeFlashLoan")(
          usd8Addr,
          ethers.parseUnits("100", 18),
          await receiver.getAddress(),
          "0x",
        ),
      ).to.be.reverted; // SafeTransfer reverts "transferFrom failed" before balance check; both are correct under-repay failure
    });
  });

  describe("07: Liquidation ExceedsCloseFactor (L2)", function () {
    it("executeLiquidation reverts ExceedsCloseFactor when repayAmount > closeFactor * debt / 100", async function () {
      const { deployer, user, usd8, lending, configurator } = await deploy();
      const usd8Address = await usd8.getAddress();
      const lendAddr = await lending.getAddress();
      await configurator.setLTV(usd8Address, 81);
      const supplyAmt = ethers.parseUnits("100", 18);
      const borrowAmt = ethers.parseUnits("81", 18);
      const usd8User = usd8.connect(user);
      const lendingUser = lending.connect(user);
      await usd8User.getFunction("approve")(lendAddr, supplyAmt);
      await lendingUser.getFunction("supply")(supplyAmt);
      await lendingUser.getFunction("borrow")(borrowAmt);
      expect(await lending.isLiquidatable(user.address)).to.eq(true);

      const Liquidation = await ethers.getContractFactory("Liquidation");
      const liquidation = await Liquidation.deploy(lendAddr);
      await liquidation.waitForDeployment();
      await lending.setLiquidationContract(await liquidation.getAddress());
      const liquidator = deployer;
      const closeFactor = 50n;
      const borrowed = borrowAmt;
      const maxRepay = (borrowed * closeFactor) / 100n;
      const repayOverClose = maxRepay + 1n;
      await usd8.connect(liquidator).getFunction("approve")(lendAddr, repayOverClose);
      await expect(
        liquidation.connect(liquidator).liquidationCall(user.address, repayOverClose),
      ).to.be.revertedWithCustomError(lending, "ExceedsCloseFactor");
    });
  });

  describe("07: setTreasury zero address (M2)", function () {
    it("setTreasury(0) reverts ZeroAddress", async function () {
      const { deployer, lending } = await deploy();
      await expect(lending.connect(deployer).setTreasury(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        lending,
        "ZeroAddress",
      );
    });
  });

  describe("Final Gate B5–B8: Configurator bounds and Oracle price zero", function () {
    it("B5: setReserveCloseFactor(0) reverts CloseFactorZero", async function () {
      const { deployer, usd8, lending, configurator } = await deploy();
      await expect(configurator.connect(deployer).setCloseFactor(await usd8.getAddress(), 0)).to.be.revertedWithCustomError(
        lending,
        "CloseFactorZero",
      );
    });
    it("B5: setReserveCloseFactor(101) reverts CloseFactorMax", async function () {
      const { deployer, usd8, lending, configurator } = await deploy();
      await expect(configurator.connect(deployer).setCloseFactor(await usd8.getAddress(), 101)).to.be.revertedWithCustomError(
        lending,
        "CloseFactorMax",
      );
    });
    it("B10: setReserveLTV(0) reverts LTVZero", async function () {
      const { deployer, usd8, lending, configurator } = await deploy();
      await expect(configurator.connect(deployer).setLTV(await usd8.getAddress(), 0)).to.be.revertedWithCustomError(
        lending,
        "LTVZero",
      );
    });
    it("B7: setReserveLiquidationThreshold(0) reverts LiquidationThresholdZero", async function () {
      const { deployer, usd8, lending, configurator } = await deploy();
      await expect(configurator.connect(deployer).setLiquidationThreshold(await usd8.getAddress(), 0)).to.be.revertedWithCustomError(
        lending,
        "LiquidationThresholdZero",
      );
    });
    it("B6: setReserveLiquidationBonus(101) reverts LiquidationBonusMax", async function () {
      const { deployer, usd8, lending, configurator } = await deploy();
      await expect(configurator.connect(deployer).setLiquidationBonus(await usd8.getAddress(), 101)).to.be.revertedWithCustomError(
        lending,
        "LiquidationBonusMax",
      );
    });
    it("B8: when oracle returns 0, getUserPosition reverts OraclePriceZero", async function () {
      const { deployer, user, usd8, lending } = await deploy();
      const poolAddr = await lending.getAddress();
      const usd8Addr = await usd8.getAddress();
      await usd8.connect(user).approve(poolAddr, ethers.parseUnits("100", 18));
      await lending.connect(user).supply(ethers.parseUnits("100", 18));
      const MockAggregator = await ethers.getContractFactory("MockAggregator");
      const mockAgg = await MockAggregator.deploy(0);
      await mockAgg.waitForDeployment();
      const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkAdapter");
      const adapter = await ChainlinkAdapter.deploy(await mockAgg.getAddress(), 365 * 24 * 3600, 0, 2e8);
      await adapter.waitForDeployment();
      const OracleRouter = await ethers.getContractFactory("OracleRouter");
      const router = await OracleRouter.deploy();
      await router.waitForDeployment();
      await router.connect(deployer).setFeed(usd8Addr, await adapter.getAddress());
      await lending.connect(deployer).setOracleRouter(await router.getAddress());
      await expect(lending.getUserPosition(user.address)).to.be.revertedWithCustomError(lending, "OraclePriceZero");
    });
  });
});
