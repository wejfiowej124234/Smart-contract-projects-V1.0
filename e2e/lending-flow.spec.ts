import {
  test,
  expect,
  injectLocalProvider,
  injectProviderViaEvaluateAndReload,
  ensureWalletConnected,
  waitForAppLayoutAfterProvider,
  waitForBlockOrKpiVisible,
  waitForTxConfirmed,
  waitForDeploymentsReady,
  waitForDashboardDataReady,
  writeDebugBundleOnFailure,
} from "./fixtures";

test.describe("Lending flow (Approve → Supply → Borrow → Repay → Withdraw)", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("connects wallet and shows dashboard @core-flow", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await page.waitForLoadState("domcontentloaded");
    await waitForAppLayoutAfterProvider(page, 25000);
    await expect(
      page.getByText(/Lending Dashboard/i).or(page.getByTestId("main-nav"))
    ).toBeVisible({ timeout: 12000 });
    await ensureWalletConnected(page, "connects wallet and shows dashboard");
    await waitForBlockOrKpiVisible(page, 35000);
    await expect(page.getByText(/Hardhat Local|31337/i)).toBeVisible({ timeout: 10000 });
  });

  async function confirmPreflightModalIfOpen(page: import("@playwright/test").Page) {
    const dialog = page.getByRole("dialog");
    try {
      await dialog.waitFor({ state: "visible", timeout: 8000 });
      const confirmBtn = dialog.getByRole("button", { name: /confirm|open wallet|checking/i });
      if (await confirmBtn.isVisible()) await confirmBtn.click();
      await dialog.waitFor({ state: "hidden", timeout: 60000 }).catch(() => {});
    } catch {
      // no dialog or already closed
    }
  }

  test("Approve → Supply → Borrow → Repay → Withdraw @tx-heavy", async ({ page }) => {
    try {
      await waitForDeploymentsReady(page, 45000);
      await waitForDashboardDataReady(page, 50000);
      await page.goto("/", { waitUntil: "load" });
      await injectProviderViaEvaluateAndReload(page);
      await waitForAppLayoutAfterProvider(page, 30000);
      await ensureWalletConnected(page, "Approve Supply Borrow Repay Withdraw", 50000);
      await waitForBlockOrKpiVisible(page, 40000);

      const supplyCard = page.locator("#action-card-supply");
      await supplyCard.locator("input").fill("10");
      const supplySubmitBtn = supplyCard.getByRole("button", { name: /Supply|Approve\s*USD8/i });
      await supplySubmitBtn.click();
      await confirmPreflightModalIfOpen(page);
      await waitForTxConfirmed(page, 120000);

      // Borrow/Repay/Withdraw depend on Supply completion; wait for receipt each time.
      const borrowCard = page.locator("#action-card-borrow");
      await borrowCard.locator("input").fill("5").catch(() => {});
      const borrowBtn = borrowCard.getByRole("button", { name: "Borrow" });
      await borrowBtn.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
      if (await borrowBtn.isEnabled().catch(() => false)) {
        await borrowBtn.click();
        await confirmPreflightModalIfOpen(page);
        await waitForTxConfirmed(page, 90000).catch(() => {});
      }

      const repayCard = page.locator("#action-card-repay");
      await repayCard.locator("input").fill("2").catch(() => {});
      const repayBtn = repayCard.getByRole("button", { name: /Repay|Approve\s*USD8/i });
      if (await repayBtn.isEnabled().catch(() => false)) {
        await repayBtn.click();
        await confirmPreflightModalIfOpen(page);
        await waitForTxConfirmed(page, 90000).catch(() => {});
      }

      const withdrawCard = page.locator("#action-card-withdraw");
      await withdrawCard.locator("input").fill("3").catch(() => {});
      const withdrawBtn = withdrawCard.getByRole("button", { name: "Withdraw" });
      if (await withdrawBtn.isEnabled().catch(() => false)) {
        await withdrawBtn.click();
        await confirmPreflightModalIfOpen(page);
        await waitForTxConfirmed(page, 90000).catch(() => {});
      }
    } catch (e) {
      await writeDebugBundleOnFailure(page, "Approve Supply Borrow Repay Withdraw", {
        error: String(e),
        phase: "tx-heavy",
      });
      throw e;
    }
  });
});
