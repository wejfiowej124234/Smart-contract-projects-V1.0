import { expect } from "chai";
import { ethers } from "hardhat";

describe("LinearRateStrategy (P2)", function () {
  let strategy: Awaited<ReturnType<ReturnType<typeof ethers.getContractFactory>["deploy"]>>;

  before(async function () {
    const LinearRateStrategy = await ethers.getContractFactory("LinearRateStrategy");
    strategy = await LinearRateStrategy.deploy();
    await strategy.waitForDeployment();
  });

  it("getSupplyRate(0) returns BASE_RATE (2)", async function () {
    const rate = await strategy.getSupplyRate(0);
    expect(rate).to.eq(2n);
  });

  it("getBorrowRate(0) returns BASE_RATE + 2 (4)", async function () {
    const rate = await strategy.getBorrowRate(0);
    expect(rate).to.eq(4n);
  });

  it("getSupplyRate(50) = 2 + 50/10 = 7", async function () {
    const rate = await strategy.getSupplyRate(50);
    expect(rate).to.eq(7n);
  });

  it("getBorrowRate(50) = 4 + 50/5 = 14", async function () {
    const rate = await strategy.getBorrowRate(50);
    expect(rate).to.eq(14n);
  });

  it("getSupplyRate(100) = 2 + 10 = 12", async function () {
    const rate = await strategy.getSupplyRate(100);
    expect(rate).to.eq(12n);
  });

  it("getBorrowRate(100) = 4 + 20 = 24", async function () {
    const rate = await strategy.getBorrowRate(100);
    expect(rate).to.eq(24n);
  });
});
