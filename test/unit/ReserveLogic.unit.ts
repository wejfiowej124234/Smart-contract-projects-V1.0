import { expect } from "chai";
import { ethers } from "hardhat";

describe("ReserveLogic (P2)", function () {
  let wrapper: Awaited<ReturnType<ReturnType<typeof ethers.getContractFactory>["deploy"]>>;
  let strategy: Awaited<ReturnType<ReturnType<typeof ethers.getContractFactory>["deploy"]>>;

  before(async function () {
    const TestReserveLogic = await ethers.getContractFactory("TestReserveLogic");
    wrapper = await TestReserveLogic.deploy();
    await wrapper.waitForDeployment();

    const LinearRateStrategy = await ethers.getContractFactory("LinearRateStrategy");
    strategy = await LinearRateStrategy.deploy();
    await strategy.waitForDeployment();
  });

  it("getUtilization(0, 0) returns 0", async function () {
    const util = await wrapper.getUtilization(0, 0);
    expect(util).to.eq(0n);
  });

  it("getUtilization(100, 0) returns 0", async function () {
    const util = await wrapper.getUtilization(100, 0);
    expect(util).to.eq(0n);
  });

  it("getUtilization(100, 50) returns 50", async function () {
    const util = await wrapper.getUtilization(100, 50);
    expect(util).to.eq(50n);
  });

  it("getUtilization(100, 100) returns 100", async function () {
    const util = await wrapper.getUtilization(100, 100);
    expect(util).to.eq(100n);
  });

  it("updateRates(100, 50, strategy) returns util=50, supplyRate=7, borrowRate=14", async function () {
    const [util, supplyRate, borrowRate] = await wrapper.updateRates.staticCall(
      100,
      50,
      await strategy.getAddress(),
    );
    expect(util).to.eq(50n);
    expect(supplyRate).to.eq(7n); // 2 + 50/10
    expect(borrowRate).to.eq(14n); // 4 + 50/5
  });

  it("updateRates(0, 0, strategy) returns util=0, supplyRate=2, borrowRate=4", async function () {
    const [util, supplyRate, borrowRate] = await wrapper.updateRates.staticCall(
      0,
      0,
      await strategy.getAddress(),
    );
    expect(util).to.eq(0n);
    expect(supplyRate).to.eq(2n);
    expect(borrowRate).to.eq(4n);
  });
});
