import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleLending (integration)", function () {
  async function deploy() {
    const [deployer, user] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    const usd8 = await TestToken.deploy("USD8", "USD8");
    await usd8.waitForDeployment();

    const SimpleLending = await ethers.getContractFactory("SimpleLending");
    const lending = await SimpleLending.deploy(await usd8.getAddress());
    await lending.waitForDeployment();

    // Fund user
    await usd8.transfer(user.address, ethers.parseUnits("1000", 18));

    return { deployer, user, usd8, lending };
  }

  it("approve → supply → borrow → repay → withdraw", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    const supplyAmt = ethers.parseUnits("100", 18);
    const borrowAmt = ethers.parseUnits("50", 18);

    await usd8.connect(user).approve(lendAddr, supplyAmt);
    await expect(lending.connect(user).supply(supplyAmt)).to.emit(lending, "Supplied");

    await expect(lending.connect(user).borrow(borrowAmt)).to.emit(lending, "Borrowed");

    await usd8.connect(user).approve(lendAddr, borrowAmt);
    await expect(lending.connect(user).repay(borrowAmt)).to.emit(lending, "Repaid");

    await expect(lending.connect(user).withdraw(supplyAmt)).to.emit(lending, "Withdrawn");

    const pos = await lending.getUserPosition(user.address);
    expect(pos[0]).to.eq(0n); // supplied
    expect(pos[1]).to.eq(0n); // borrowed
  });

  it("reverts when borrowing above max", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    await usd8.connect(user).approve(lendAddr, ethers.parseUnits("100", 18));
    await lending.connect(user).supply(ethers.parseUnits("100", 18));

    // max borrow is 75% of supply
    await expect(lending.connect(user).borrow(ethers.parseUnits("76", 18))).to.be.revertedWith(
      "Exceeds borrowing limit",
    );
  });

  it("reverts when withdrawing would make position unhealthy", async function () {
    const { user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    await usd8.connect(user).approve(lendAddr, ethers.parseUnits("100", 18));
    await lending.connect(user).supply(ethers.parseUnits("100", 18));
    await lending.connect(user).borrow(ethers.parseUnits("75", 18));

    // withdrawing any amount would break LTV
    await expect(lending.connect(user).withdraw(ethers.parseUnits("1", 18))).to.be.revertedWith(
      "Withdrawal would make position unhealthy",
    );
  });

  it("can be paused by owner and blocks actions", async function () {
    const { deployer, user, usd8, lending } = await deploy();

    const lendAddr = await lending.getAddress();
    await usd8.connect(user).approve(lendAddr, ethers.parseUnits("10", 18));

    await lending.connect(deployer).pause();
    await expect(lending.connect(user).supply(ethers.parseUnits("10", 18))).to.be.revertedWith(
      "Pausable: paused",
    );

    await lending.connect(deployer).unpause();
    await expect(lending.connect(user).supply(ethers.parseUnits("10", 18))).to.emit(lending, "Supplied");
  });
});
