import {
  test,
  expect,
  injectLocalProvider,
  injectProviderViaEvaluateAndReload,
  ensureWalletConnected,
  waitForAppLayoutAfterProvider,
  waitForDeploymentsReady,
  waitForDashboardDataReady,
} from "./fixtures";

/**
 * Verifies D11: Markets Supply/Borrow CTA → Dashboard with ?action= prefill and scroll to card.
 * Real user business closure: click Supply on Markets lands on Dashboard with Supply card in view.
 */
test.describe("Markets CTA prefill (D11) @core-flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("Markets Supply CTA navigates to Dashboard with action=supply and Supply card visible", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/markets", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Markets Supply CTA prefill");

    await expect(page.getByRole("heading", { name: /markets/i }).or(page.getByTestId("reserve-list"))).toBeVisible({ timeout: 10000 });

    const supplyCta = page.getByRole("link", { name: /supply/i }).first();
    await expect(supplyCta).toBeVisible({ timeout: 8000 });
    await supplyCta.click();

    await expect(page).toHaveURL(/action=supply/, { timeout: 8000 });
    const supplyCard = page.locator("#action-card-supply");
    await expect(supplyCard).toBeVisible({ timeout: 8000 });
  });

  test("Markets Borrow CTA navigates to Dashboard with action=borrow and Borrow card visible", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/markets", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Markets Borrow CTA prefill");

    const borrowCta = page.getByRole("link", { name: /borrow/i }).first();
    await expect(borrowCta).toBeVisible({ timeout: 8000 });
    await borrowCta.click();

    await expect(page).toHaveURL(/action=borrow/, { timeout: 8000 });
    const borrowCard = page.locator("#action-card-borrow");
    await expect(borrowCard).toBeVisible({ timeout: 8000 });
  });
});
