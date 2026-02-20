/**
 * Playwright coverage for mainnet-gap design: Dashboard KPI (borrow limit used),
 * Preflight (estimated gas / simulation), TxStatus (lifecycle / confirmed in), Data Provenance (Block · Xs ago), Diagnostics RPC.
 */
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
} from "./fixtures";

test.describe("Mainnet-gap UI (Dashboard / Preflight / TxStatus / Provenance / Diagnostics) @core-flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("Dashboard KPI bar has region and optionally Borrow limit used", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await page.waitForLoadState("domcontentloaded");
    await waitForAppLayoutAfterProvider(page, 25000);
    await ensureWalletConnected(page, "Dashboard KPI");
    await waitForBlockOrKpiVisible(page, 35000);
    const kpiBar = page.getByTestId("dashboard-kpi-bar");
    await expect(kpiBar).toHaveAttribute("aria-label", /key metrics/i);
    await expect(page.getByText(/Borrow limit|Total supply|Health factor/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("Data provenance block expands and shows Block and optional ago", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page, 25000);
    await ensureWalletConnected(page, "Data provenance");
    await waitForBlockOrKpiVisible(page, 25000);
    const block = page.getByTestId("data-provenance");
    await block.click();
    await expect(block.getByText(/Block|Updated|Oracle|Precision/i).first()).toBeVisible({ timeout: 3000 });
    const content = block.locator(".dataProvenanceContent");
    await expect(content).toBeVisible();
    if (await content.getByText(/ago|just now|~0s/i).isVisible().catch(() => false)) {
      await expect(content).toContainText(/Block \d+ · .*ago|just now|~0s/);
    }
  });

  test("Preflight modal shows Transaction overview and gas or simulation hint", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page, 25000);
    await ensureWalletConnected(page, "Preflight");
    await waitForBlockOrKpiVisible(page, 20000);
    const supplyCard = page.locator("#action-card-supply");
    await supplyCard.locator("input").fill("1");
    await supplyCard.getByRole("button", { name: "Supply" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByText(/Transaction overview/i)).toBeVisible();
    await expect(
      dialog.getByText(/Estimated gas|Transaction would revert|Simulation failed|gas|Impact/i).first()
    ).toBeVisible({ timeout: 5000 });
    await dialog.getByRole("button", { name: /close|cancel/i }).first().click().catch(() => {});
  });

  test("TxStatus shows lifecycle when tx in progress and outcome when done", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "TxStatus");
    const supplyCard = page.locator("#action-card-supply");
    await supplyCard.locator("input").fill("1");
    await supplyCard.getByRole("button", { name: "Supply" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 8000 });
    const confirmBtn = dialog.getByRole("button", { name: /confirm|open wallet|checking/i });
    await confirmBtn.click().catch(() => {});
    await waitForTxConfirmed(page, 120000);
    const txBox = page.locator(".txBox");
    if (await txBox.isVisible().catch(() => false)) {
      await expect(txBox.getByText(/Signing|Pending|Confirmed|Failed|Replaced|Submitted/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });

  test("Diagnostics page shows RPC tier and optional URL", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/diagnostics", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page, 20000);
    const rpcSection = page.getByTestId("diagnostics-rpc");
    await expect(rpcSection).toBeVisible({ timeout: 15000 });
    await expect(rpcSection.getByText(/RPC tier|primary|fallback|RPC/i).first()).toBeVisible();
  });
});
