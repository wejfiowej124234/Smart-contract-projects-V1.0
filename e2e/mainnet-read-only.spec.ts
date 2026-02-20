/**
 * Mainnet read-only E2E (zero-trust release evidence).
 * Run only when E2E_MAINNET_READ_ONLY=1 and E2E_BASE_URL points to mainnet frontend.
 * Asserts: page loads, read-only data visible (pool/markets), no write actions enabled.
 * Sends NO transactions.
 */
import { test, expect } from "@playwright/test";

const MAINNET_READ_ONLY = process.env.E2E_MAINNET_READ_ONLY === "1" || process.env.E2E_MAINNET_READ_ONLY === "true";
const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";

test.describe("Mainnet read-only (release evidence)", () => {
  test.skip(!MAINNET_READ_ONLY, "Run with E2E_MAINNET_READ_ONLY=1 and E2E_BASE_URL=<mainnet frontend>");

  test("loads and shows read-only dashboard or markets without sending tx", async ({ page }) => {
    await page.goto(BASE_URL + "/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await expect(page.getByText(/Lending Dashboard|Markets|Governance/i).first()).toBeVisible({ timeout: 10000 });

    // Read-only: no wallet injected; we expect either connect prompt or public pool/market data
    const hasConnect = await page.getByText(/Connect wallet|connect/i).first().isVisible().catch(() => false);
    const hasPoolOrMarkets = await page.getByText(/Pool|Markets|Supply APY|Total supply|utilization/i).first().isVisible().catch(() => false);
    expect(hasConnect || hasPoolOrMarkets).toBeTruthy();

    // Ensure we did not trigger any tx (no MetaMask / no write)
    const writeButtons = page.getByRole("button", { name: /Supply|Borrow|Repay|Withdraw|Approve/i });
    const count = await writeButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = writeButtons.nth(i);
      const isDisabled = await btn.isDisabled().catch(() => true);
      expect(isDisabled).toBeTruthy();
    }
  });

  test("markets page shows read-only data when mainnet read-only", async ({ page }) => {
    await page.goto(BASE_URL + "/markets", { waitUntil: "domcontentloaded", timeout: 15000 });
    await expect(page.getByText(/Markets|Supply APY|Connect/i).first()).toBeVisible({ timeout: 10000 });
    // No write submissions
    const submitButtons = page.getByRole("button", { name: /Supply|Borrow/i });
    const n = await submitButtons.count();
    for (let i = 0; i < n; i++) {
      await expect(submitButtons.nth(i)).toBeDisabled();
    }
  });
});
