import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleLending (integration)", function () {
  // Strategic note (why): ethers v6 + Hardhat typegen can infer contracts as `BaseContract`,
  // making direct method calls show TS redlines. `getFunction("...")(...args)` is type-safe
  // and matches how the frontend write-model dispatches calls.
  async function deploy() {
    const [deployer, user] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    const usd8 = await TestToken.deploy("USD8", "USD8");
    await usd8.waitForDeployment();

    const SimpleLending = await ethers.getContractFactory("SimpleLending");
    const lending = await SimpleLending.deploy(await usd8.getAddress());
    await lending.waitForDeployment();

    // Fund user
    await usd8.getFunction("transfer")(user.address, ethers.parseUnits("1000", 18));

    return { deployer, user, usd8, lending };
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

  it("reverts when borrowing above max", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("100", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("100", 18));

    // max borrow is 75% of supply
    await expect(lendingUser.getFunction("borrow")(ethers.parseUnits("76", 18))).to.be.revertedWith(
      "Exceeds borrowing limit",
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
    await expect(lendingUser.getFunction("withdraw")(ethers.parseUnits("1", 18))).to.be.revertedWith(
      "Withdrawal would make position unhealthy",
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

    await expect(lendingUser.getFunction("borrow")(ethers.parseUnits("1", 18))).to.be.revertedWith(
      "Insufficient liquidity",
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
    await expect(lendingUser.getFunction("repay")(ethers.parseUnits("6", 18))).to.be.revertedWith(
      "Amount exceeds borrow",
    );
  });

  it("reverts when withdrawing more than supplied", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("1", 18));
    await lendingUser.getFunction("supply")(ethers.parseUnits("1", 18));

    await expect(lendingUser.getFunction("withdraw")(ethers.parseUnits("2", 18))).to.be.revertedWith(
      "Insufficient supply",
    );
  });

  it("can be paused by owner and blocks actions", async function () {
    const { deployer, user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const usd8User = usd8.connect(user);
    const lendingOwner = lending.connect(deployer);
    const lendingUser = lending.connect(user);

    await usd8User.getFunction("approve")(lendAddr, ethers.parseUnits("10", 18));

    await lendingOwner.getFunction("pause")();
    await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.be.revertedWith(
      "Pausable: paused",
    );

    await lendingOwner.getFunction("unpause")();
    await expect(lendingUser.getFunction("supply")(ethers.parseUnits("10", 18))).to.emit(lending, "Supplied");
  });
});
