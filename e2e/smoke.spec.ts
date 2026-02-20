/**
 * Smoke tier: ~10s. App loads, provider ready, layout visible. No wallet connect, no chain writes.
 * Aave/Compound-style: fast gate before core-flow or full forensic.
 */
import { test, expect, injectLocalProvider, waitForAppLayoutAfterProvider } from "./fixtures";

test.describe("Smoke @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("app loads and layout visible after provider ready", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await waitForAppLayoutAfterProvider(page);
    await expect(
      page.getByTestId("main-nav").or(page.getByRole("button", { name: /connect wallet|disconnect/i })).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("main routes respond (no crash)", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await waitForAppLayoutAfterProvider(page);
    await page.goto("/markets", { waitUntil: "load" });
    await expect(page.getByTestId("app-layout")).toBeVisible({ timeout: 5000 });
    await page.goto("/governance", { waitUntil: "load" });
    await expect(page.getByTestId("app-layout")).toBeVisible({ timeout: 5000 });
  });
});
