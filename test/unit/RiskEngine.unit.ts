import { expect } from "chai";
import { ethers } from "hardhat";

describe("RiskEngine (P7)", function () {
  let wrapper: Awaited<ReturnType<ReturnType<typeof ethers.getContractFactory>["deploy"]>>;

  before(async function () {
    const TestRiskEngine = await ethers.getContractFactory("TestRiskEngine");
    wrapper = await TestRiskEngine.deploy();
    await wrapper.waitForDeployment();
  });

  it("calculateHealthFactor: debt 0 returns max", async function () {
    const hf = await wrapper.calculateHealthFactor(100, 0, 80);
    expect(hf).to.eq(2n ** 256n - 1n);
  });

  it("calculateHealthFactor: collateral 100, debt 50, LT 80 => 160", async function () {
    const hf = await wrapper.calculateHealthFactor(100, 50, 80);
    expect(hf).to.eq(160n);
  });

  it("isLiquidatable: debt 0 => false", async function () {
    expect(await wrapper.isLiquidatable(100, 0, 80)).to.eq(false);
  });

  it("isLiquidatable: HF >= 100 => false", async function () {
    expect(await wrapper.isLiquidatable(100, 50, 80)).to.eq(false);
  });

  it("isLiquidatable: HF < 100 => true", async function () {
    expect(await wrapper.isLiquidatable(60, 50, 80)).to.eq(true);
  });

  it("getMaxBorrow: collateral 100, LTV 75 => 75", async function () {
    expect(await wrapper.getMaxBorrow(100, 75)).to.eq(75n);
  });

  it("getMaxWithdraw: debt 0 => full collateral", async function () {
    expect(await wrapper.getMaxWithdraw(100, 0, 75)).to.eq(100n);
  });

  it("getMaxWithdraw: collateral 100, debt 50, LTV 75 => 33", async function () {
    const minRequired = (50n * 100n) / 75n;
    expect(await wrapper.getMaxWithdraw(100, 50, 75)).to.eq(100n - minRequired);
  });
});
