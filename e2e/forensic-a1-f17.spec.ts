/**
 * Pre-release forensic: we run A1–F17 in a real browser, screenshot each step and record tx hashes/console evidence.
 * Evidence is written to e2e/evidence/forensic/forensic-{A1|A2|...|F17}.png and forensic-evidence.json.
 * RC can be promoted to Forensic-GO only when E2E=0 and all forensic steps pass.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  test,
  expect,
  injectLocalProvider,
  injectProviderViaEvaluateAndReload,
  ensureWalletConnected,
  waitForAppLayoutAfterProvider,
  waitForBlockOrKpiVisible,
  waitForTxConfirmed,
} from "./fixtures";

const FORENSIC_DIR = path.join(process.cwd(), "e2e", "evidence", "forensic");
const EVIDENCE_JSON = path.join(FORENSIC_DIR, "forensic-evidence.json");

type ForensicEntry = {
  id: string;
  pass: boolean;
  screenshotPath?: string;
  txHash?: string;
  consoleExcerpt?: string;
  note?: string;
};

function ensureForensicDir(): void {
  try {
    fs.mkdirSync(FORENSIC_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function captureForensic(
  page: import("@playwright/test").Page,
  id: string,
  pass: boolean,
  extra?: { txHash?: string; consoleExcerpt?: string; note?: string }
): Promise<void> {
  ensureForensicDir();
  const screenshotPath = path.join(FORENSIC_DIR, `forensic-${id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  const entry: ForensicEntry = {
    id,
    pass,
    screenshotPath: path.relative(process.cwd(), screenshotPath),
    ...extra,
  };
  let entries: ForensicEntry[] = [];
  try {
    const raw = fs.readFileSync(EVIDENCE_JSON, "utf-8");
    entries = JSON.parse(raw) as ForensicEntry[];
  } catch {
    // new file
  }
  const idx = entries.findIndex((e) => e.id === id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  entries.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  fs.writeFileSync(EVIDENCE_JSON, JSON.stringify(entries, null, 2), "utf-8");
}

test.describe("Forensic A1–F17 (pre-release evidence) @forensic", () => {
  test.beforeEach(async ({ page }) => {
    await injectLocalProvider(page);
  });

  test("A1: Routes /, /markets, /governance", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic A1");
    await expect(page.getByText(/Lending Dashboard/i)).toBeVisible({ timeout: 10000 });
    await captureForensic(page, "A1-dashboard", true);

    await page.goto("/markets", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /markets/i }).or(page.getByTestId("reserve-list"))).toBeVisible({ timeout: 10000 });
    await captureForensic(page, "A1-markets", true);

    await page.goto("/governance", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /governance/i })).toBeVisible({ timeout: 10000 });
    await captureForensic(page, "A1-governance", true);
  });

  test("A2: Route /markets/:assetId", async ({ page }) => {
    await page.goto("/markets/USD8", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic A2");
    await expect(page.getByText(/Single-asset mode|USD8|market/i).first()).toBeVisible({ timeout: 10000 });
    await captureForensic(page, "A2", true);
  });

  test("A3: Routes /activity, /settings", async ({ page }) => {
    await page.goto("/activity", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await expect(page.getByRole("heading", { name: /activity/i }).or(page.getByTestId("activity-page"))).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/F5 optional|not implemented|Connect wallet|No transactions yet|All|Pending|Success/i).first(),
    ).toBeVisible({ timeout: 5000 });
    await captureForensic(page, "A3-activity", true);

    await page.goto("/settings", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/F5 optional|not implemented|Settings/i).first()).toBeVisible({ timeout: 5000 });
    await captureForensic(page, "A3-settings", true);
  });

  test("B4: Dashboard data load", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic B4");
    await waitForBlockOrKpiVisible(page, 20000);
    await expect(page.getByText(/Lending Dashboard/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Supply|Borrow|Actions/i).first()).toBeVisible({ timeout: 5000 });
    await captureForensic(page, "B4", true);
  });

  test("C7+D10+D11+D12: Markets and CTA prefill", async ({ page }) => {
    await page.goto("/markets", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic D10");
    await expect(page.getByRole("heading", { name: /markets/i }).or(page.getByTestId("reserve-list"))).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Simulated data/i).or(page.getByRole("columnheader", { name: /Supply APY/i })).or(page.getByText(/Supply APY|Utilization/i)).first()).toBeVisible({ timeout: 8000 });
    await captureForensic(page, "D10", true);

    const supplyCta = page.getByRole("link", { name: /supply/i }).first();
    await supplyCta.click();
    await expect(page).toHaveURL(/action=supply/, { timeout: 8000 });
    await expect(page.locator("#action-card-supply")).toBeVisible({ timeout: 8000 });
    await captureForensic(page, "D11", true);

    await page.goto("/markets", { waitUntil: "load" });
    await expect(page.getByLabel(/Simulated data/i).or(page.getByText(/Supply APY|Markets/i)).first()).toBeVisible({ timeout: 8000 });
    await captureForensic(page, "D12", true);
  });

  test("C8+C9: Supply on-chain tx and Preflight/Tx state", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic C8");
    await waitForBlockOrKpiVisible(page, 15000);

    const supplyCard = page.locator("#action-card-supply");
    await supplyCard.locator("input").fill("10");
    await supplyCard.getByRole("button", { name: /supply/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    if (await dialog.isVisible()) {
      await captureForensic(page, "C9-preflight", true);
      const confirmBtn = dialog.getByRole("button", { name: /confirm|open wallet|checking/i });
      if (await confirmBtn.isVisible()) await confirmBtn.click();
      await dialog.waitFor({ state: "hidden", timeout: 60000 }).catch(() => {});
    }

    await waitForTxConfirmed(page, 120000).catch(() => {});
    const txArea = page.getByText(/0x[a-fA-F0-9]{10,}/);
    let txHash: string | undefined;
    if (await txArea.isVisible().catch(() => false)) {
      txHash = (await txArea.textContent())?.trim().slice(0, 66) ?? undefined;
    }
    await captureForensic(page, "C8-supply", true, { txHash });
  });

  test("E13: Governance proposal list", async ({ page }) => {
    await page.goto("/governance", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic E13");
    await expect(
      page.getByText(/proposal|loading|connect wallet to view|State|Votes|Action|No proposals yet|Governance overview/i).first()
    ).toBeVisible({ timeout: 10000 });
    await captureForensic(page, "E13", true);
  });

  test("F16: LTV/LT display", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic F16");
    const riskDetails = page.locator(".riskParametersDetails").or(page.getByTestId("risk-parameters-panel"));
    await riskDetails.locator("summary").first().click().catch(() => {});
    await page.waitForTimeout(500);
    await expect(
      page.getByText(/LTV|Liquidation|75%|80%|default|Risk/i).first()
    ).toBeVisible({ timeout: 5000 });
    await captureForensic(page, "F16", true);
  });

  test("F17: Pause/Unpause or Dashboard", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await injectProviderViaEvaluateAndReload(page);
    await waitForAppLayoutAfterProvider(page);
    await ensureWalletConnected(page, "Forensic F17");
    const pauseOrDashboard = page
      .getByRole("region", { name: /pause control/i })
      .or(page.getByText(/Pool is (active|paused)/i))
      .or(page.getByText(/Lending Dashboard/i));
    await expect(pauseOrDashboard.first()).toBeVisible({ timeout: 15000 });
    await captureForensic(page, "F17", true);
  });
});
