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
 * Production stability: Diagnostics RPC section shows real runtime state
 * (rpcFailCount, rpcLastOkAt, rpcUrlInUse / tier) from rpcHealth.
 */
test.describe("Diagnostics RPC section @core-flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("Diagnostics page shows RPC section with tier and fail count labels", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/diagnostics", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page, 35000);
    await ensureWalletConnected(page, "Diagnostics RPC section");

    await page.goto("/diagnostics", { waitUntil: "load" });
    await waitForAppLayoutAfterProvider(page, 35000);
    await page.getByTestId("diagnostics-frontend-version").waitFor({ state: "visible", timeout: 25000 });

    const rpcSection = page.getByTestId("diagnostics-rpc");
    await expect(rpcSection).toBeVisible({ timeout: 20000 });
    await expect(rpcSection.getByText(/RPC tier/i)).toBeVisible({ timeout: 8000 });
    await expect(rpcSection.getByText(/RPC fail count|rpcFailCount|fail count/i)).toBeVisible({ timeout: 8000 });
    await expect(rpcSection.getByText(/last OK|rpcLastOkAt|last success|RPC last OK/i)).toBeVisible({ timeout: 8000 });
  });

  test("Activity page renders status and outcome columns", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/activity", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page, 35000);
    await ensureWalletConnected(page, "Activity outcome");

    await page.goto("/activity", { waitUntil: "load" });
    await waitForAppLayoutAfterProvider(page, 35000);
    await page.getByTestId("activity-page").waitFor({ state: "visible", timeout: 20000 });

    await expect(page.getByText(/Activity|Transaction/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Status|status/i)).toBeVisible({ timeout: 5000 });
  });

  /**
   * Fallback RPC visibility: when primary is bad and fallback is used, UI shows "Using fallback RPC" or tier fallback.
   * Run with: VITE_LOCAL_RPC_URL=http://127.0.0.1:99999 VITE_RPC_URL_31337_FALLBACK=http://127.0.0.1:8545 (frontend),
   * then E2E_SIMULATE_FALLBACK_RPC=1 npm run e2e:ui (or e2e smoke).
   */
  test("fallback RPC visible when primary fails", async ({ page }) => {
    test.skip(
      process.env.E2E_SIMULATE_FALLBACK_RPC !== "1",
      "Set E2E_SIMULATE_FALLBACK_RPC=1 and start frontend with VITE_LOCAL_RPC_URL=bad URL and VITE_RPC_URL_31337_FALLBACK=http://127.0.0.1:8545"
    );
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/diagnostics", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await ensureWalletConnected(page, "fallback RPC visibility");
    await page.goto("/diagnostics", { waitUntil: "load" });

    const rpcSection = page.getByTestId("diagnostics-rpc");
    await expect(rpcSection).toBeVisible({ timeout: 10000 });
    await expect(rpcSection.getByText(/fallback|Using fallback RPC/i)).toBeVisible({ timeout: 5000 });
  });
});
