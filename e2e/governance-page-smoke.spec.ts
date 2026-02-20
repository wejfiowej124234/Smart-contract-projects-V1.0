import {
  test,
  expect,
  injectLocalProvider,
  waitForAppLayoutAfterProvider,
  waitForDeploymentsReady,
  waitForDashboardDataReady,
} from "./fixtures";

/**
 * Minimal smoke test for Governance page: ensures the page loads without JSX/parse errors.
 * Catches regressions like ternary/fragment mismatch (Expected ":" but found "}").
 */
test.describe("Governance page smoke @core-flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("Governance page renders without crash", async ({ page }) => {
    await waitForDeploymentsReady(page);
    await waitForDashboardDataReady(page);
    await page.goto("/governance", { waitUntil: "load" });
    await waitForAppLayoutAfterProvider(page, 30000);
    await page.getByTestId("governance-page").waitFor({ state: "visible", timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: /governance/i }).or(
        page.getByText(/connect wallet to see your voting power|no governor configured/i)
      )
    ).first().toBeVisible({ timeout: 8000 });
  });
});
