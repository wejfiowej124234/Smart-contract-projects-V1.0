import * as fs from "node:fs";
import * as path from "node:path";
import { test as base, expect } from "@playwright/test";

export { expect };

/** Hardhat default account #0 (used by deploy and E2E). */
export const E2E_TEST_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/** RPC URL and chainId hex for E2E mock provider; must match docs/09 and configs/localChain.mjs (http://127.0.0.1:8545, 31337). Override via E2E_RPC_URL / E2E_CHAIN_ID_HEX. */
const E2E_RPC_URL = process.env.E2E_RPC_URL || "http://127.0.0.1:8545";
const E2E_CHAIN_ID_HEX = process.env.E2E_CHAIN_ID_HEX || "0x7a69";

/** Inline script injected into <head> so window.ethereum exists before any app script runs (fixes CI/headless timing). */
function providerInlineScript(addr: string): string {
  const escaped = addr.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const rpcEscaped = E2E_RPC_URL.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return [
    "(function(){",
    'var A="' + escaped + '";',
    'var RPC="' + rpcEscaped + '";',
    'var CHAIN_HEX="' + E2E_CHAIN_ID_HEX.replace(/"/g, '\\"') + '";',
    "window.ethereum={",
    "request:function(args){",
    "var m=(args&&args.method)||\"\";",
    'if(m==="eth_requestAccounts")return Promise.resolve([A]);',
    'if(m==="eth_accounts")return Promise.resolve([A]);',
    'if(m==="eth_chainId")return Promise.resolve(CHAIN_HEX);',
    'if(m==="wallet_switchEthereumChain")return Promise.resolve(null);',
    'if(m==="wallet_addEthereumChain")return Promise.resolve(null);',
    'if(m==="wallet_requestPermissions")return Promise.resolve([{parentCapability:"eth_accounts"}]);',
    'return fetch(RPC,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:m,params:(args&&args.params)||[]})})',
    ".then(function(r){return r.json();})",
    ".then(function(j){if(j.error)throw new Error(j.error.message||\"RPC error\");return j.result;});",
    "},",
    "on:function(){},removeListener:function(){}",
    "};",
    "console.log(\"E2E[route.fulfill]: typeof window.ethereum=\",typeof window.ethereum);",
    "document.addEventListener(\"DOMContentLoaded\",function(){console.log(\"E2E[DOMContentLoaded]: typeof window.ethereum=\",typeof window.ethereum);});",
    "window.addEventListener(\"load\",function(){console.log(\"E2E[load]: typeof window.ethereum=\",typeof window.ethereum);});",
    "})();",
  ].join("");
}

function injectProviderIntoHtml(html: string, addr: string): string {
  const script = providerInlineScript(addr);
  const tag = "<script>" + script + "</script>";
  return html.replace(/(<head(?:\s[^>]*)?>)/i, "$1" + tag);
}

/** Injects provider via evaluate then reloads so route/addInitScript run again and app sees window.ethereum. */
export async function injectProviderViaEvaluateAndReload(page: import("@playwright/test").Page) {
  await page.evaluate(
    ({ addr, rpcUrl, chainIdHex }: { addr: string; rpcUrl: string; chainIdHex: string }) => {
      const w = window as unknown as Record<string, unknown>;
      w.ethereum = {
        request: (args: { method?: string; params?: unknown }) => {
          const m = (args && args.method) || "";
          if (m === "eth_requestAccounts") return Promise.resolve([addr]);
          if (m === "eth_accounts") return Promise.resolve([addr]);
          if (m === "eth_chainId") return Promise.resolve(chainIdHex);
          if (m === "wallet_switchEthereumChain" || m === "wallet_addEthereumChain") return Promise.resolve(null);
          if (m === "wallet_requestPermissions") return Promise.resolve([{ parentCapability: "eth_accounts" }]);
          return fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: (args && args.params) || [] }),
        })
          .then((r: Response) => r.json())
          .then((j: { error?: { message?: string }; result?: unknown }) => {
            if (j.error) throw new Error(j.error.message || "RPC error");
            return j.result;
          });
        },
        on: () => {},
        removeListener: () => {},
      };
    },
    { addr: E2E_TEST_ACCOUNT, rpcUrl: E2E_RPC_URL, chainIdHex: E2E_CHAIN_ID_HEX }
  );
  await page.reload({ waitUntil: "networkidle" });
}

/**
 * Forward page console lines containing E2E[...] or typeof window.ethereum to Node (fail-fast evidence chain).
 * Call once per page (e.g. inside injectLocalProvider).
 */
export function attachE2EConsoleForwarder(page: import("@playwright/test").Page): void {
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("E2E[") || text.includes("typeof window.ethereum")) {
      console.log("[E2E page console]", text);
    }
  });
}

/**
 * Fail-fast diagnostic: when "Connect wallet" isn’t found we record Connect/InstallMetaMask visibility, typeof window.ethereum,
 * and first 800 chars of body, write e2e/evidence/e2e-diagnostic-<ts>-<test>.md and log to Node, then throw so screenshots/traces are captured.
 */
export async function runE2EDiagnostics(
  page: import("@playwright/test").Page,
  testTitle?: string
): Promise<never> {
  const evidenceDir = path.join(process.cwd(), "e2e", "evidence");
  try {
    fs.mkdirSync(evidenceDir, { recursive: true });
  } catch {
    // ignore
  }
  let diag: {
    connectWalletVisible: boolean;
    installMetaMaskVisible: boolean;
    typeofEthereum: string;
    bodySnippet: string;
  };
  try {
    diag = await page.evaluate(() => {
      const bodyText = document.body?.innerText ?? "";
      return {
        connectWalletVisible: /connect wallet/i.test(bodyText),
        installMetaMaskVisible: /install metamask/i.test(bodyText),
        typeofEthereum: typeof (window as unknown as { ethereum?: unknown }).ethereum,
        bodySnippet: bodyText.slice(0, 800),
      };
    });
  } catch (e) {
    diag = {
      connectWalletVisible: false,
      installMetaMaskVisible: false,
      typeofEthereum: String(e),
      bodySnippet: "",
    };
  }
  const lines = [
    "# E2E fail-fast diagnostic",
    `time: ${new Date().toISOString()}`,
    `test: ${testTitle ?? "unknown"}`,
    "",
    "## Result",
    `- "Connect wallet" visible: ${diag.connectWalletVisible}`,
    `- "Install MetaMask" visible: ${diag.installMetaMaskVisible}`,
    `- typeof window.ethereum: ${diag.typeofEthereum}`,
    "",
    "## Page body snippet",
    "```",
    diag.bodySnippet,
    "```",
  ];
  const out = lines.join("\n");
  const slug = testTitle?.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") ?? "unknown";
  const filename = `e2e-diagnostic-${Date.now()}-${slug}.md`;
  const filepath = path.join(evidenceDir, filename);
  try {
    fs.writeFileSync(filepath, out, "utf-8");
  } catch {
    // ignore
  }
  console.log("[E2E diagnostic]", out);
  console.log("[E2E diagnostic] written to", filepath);
  throw new Error(
    `E2E: "Connect wallet" not found. Install MetaMask visible: ${diag.installMetaMaskVisible}. typeof window.ethereum: ${diag.typeofEthereum}. See ${filepath}`
  );
}

/**
 * On failure we write a debug bundle (URL, time, body snippet) so we can inspect tx-heavy or other failing steps.
 */
export async function writeDebugBundleOnFailure(
  page: import("@playwright/test").Page,
  testTitle?: string,
  extra?: Record<string, unknown>
): Promise<void> {
  const evidenceDir = path.join(process.cwd(), "e2e", "evidence");
  try {
    fs.mkdirSync(evidenceDir, { recursive: true });
  } catch {
    // ignore
  }
  let bodySnippet = "";
  try {
    bodySnippet = await page.evaluate(() => document.body?.innerText?.slice(0, 1500) ?? "");
  } catch {
    bodySnippet = String(extra?.evaluateError ?? "n/a");
  }
  const slug = (testTitle ?? "unknown").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  const out = {
    time: new Date().toISOString(),
    test: testTitle,
    url: page.url(),
    bodySnippetLength: bodySnippet.length,
    bodySnippet: bodySnippet.slice(0, 1200),
    ...extra,
  };
  const filepath = path.join(evidenceDir, `debug-bundle-${Date.now()}-${slug}.json`);
  try {
    fs.writeFileSync(filepath, JSON.stringify(out, null, 2), "utf-8");
    console.log("[E2E debug bundle] written to", filepath);
  } catch {
    // ignore
  }
}

/**
 * Poll until the provider is ready (window.ethereum present and eth_chainId === 0x7a69).
 * We wait for chain/injection before waiting for app layout, instead of a fixed timeout.
 */
export async function waitForProviderReady(
  page: import("@playwright/test").Page,
  timeoutMs = 15000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(async () => {
      const w = (window as unknown as { ethereum?: { request: (arg: { method: string }) => Promise<unknown> } }).ethereum;
      if (!w) return false;
      try {
        const id = await w.request({ method: "eth_chainId" });
        return id === "0x7a69";
      } catch {
        return false;
      }
    });
    if (ready) return;
    await page.waitForTimeout(300);
  }
  throw new Error(`waitForProviderReady: timeout after ${timeoutMs}ms`);
}

/**
 * We wait for the provider first, then for app-layout to be visible (instead of a fixed layout timeout).
 */
export async function waitForAppLayoutAfterProvider(
  page: import("@playwright/test").Page,
  timeoutMs = 20000
): Promise<void> {
  await waitForProviderReady(page, Math.min(10000, Math.floor(timeoutMs / 2)));
  await page.getByTestId("app-layout").waitFor({ state: "visible", timeout: timeoutMs });
}

/**
 * Poll until on-chain data shows in the UI (Block or KPI contains a number).
 * We wait for real chain data to appear rather than a fixed KPI timeout.
 */
export async function waitForBlockOrKpiVisible(
  page: import("@playwright/test").Page,
  timeoutMs = 25000
): Promise<void> {
  const bar = page.getByTestId("dashboard-kpi-bar").or(page.getByTestId("data-provenance"));
  await bar.waitFor({ state: "visible", timeout: timeoutMs });
  await expect(bar.first()).toContainText(/\d+/, { timeout: 8000 });
}

/**
 * Hard barrier (1) deploymentsReady: open /diagnostics, wait for version, RPC, connect wallet (to get chainId),
 * then Deployments: Yes and at least one key contract address (Lending 0x...), so we don’t get a false ready.
 */
export async function waitForDeploymentsReady(
  page: import("@playwright/test").Page,
  timeoutMs = 40000
): Promise<void> {
  await page.goto("/diagnostics", { waitUntil: "load" });
  await page.waitForLoadState("domcontentloaded");
  await injectProviderViaEvaluateAndReload(page);
  await waitForAppLayoutAfterProvider(page, Math.min(28000, timeoutMs));
  await page.getByTestId("diagnostics-frontend-version").waitFor({ state: "visible", timeout: 15000 });
  const rpcSection = page.getByTestId("diagnostics-rpc");
  await rpcSection.waitFor({ state: "visible", timeout: 15000 });
  await expect(rpcSection.getByText(/RPC tier|primary|fallback/i).first()).toBeVisible({ timeout: 8000 });
  const deploymentsHint = page.getByText(/Deployments|Yes|No|chainId/i).first();
  await expect(deploymentsHint).toBeVisible({ timeout: 5000 });
  await expectConnectWalletOrDiagnose(page, "deploymentsReady", Math.min(35000, timeoutMs));
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible()) await connectBtn.click();
  await page.getByRole("button", { name: /disconnect/i }).waitFor({ state: "visible", timeout: 50000 });
  await page.locator(".diagnosticsSection").filter({ hasText: "Deployments" }).filter({ hasText: "Yes" }).waitFor({ state: "visible", timeout: 15000 });
  const contractEl = page.getByTestId("diagnostics-contract-address");
  try {
    await contractEl.waitFor({ state: "visible", timeout: 15000 });
    await expect(contractEl).toContainText(/0x[a-fA-F0-9]{40}/);
  } catch (e) {
    throw new Error(
      `waitForDeploymentsReady: Lending address (0x...) not visible. Ensure local chain + deploy:localhost + deploy:p9 and wallet connected. ${String(e)}`
    );
  }
}

/**
 * Hard barrier (2) dashboardDataReady: go to Dashboard and wait for real on-chain data so we don’t rely on UI defaults/cache.
 * We require: Block N is numeric (data-provenance first row not placeholder); Borrow limit used or Health factor not placeholder (or any numeric KPI if no position, e.g. Total supply 0).
 */
export async function waitForDashboardDataReady(
  page: import("@playwright/test").Page,
  timeoutMs = 45000
): Promise<void> {
  await page.goto("/", { waitUntil: "load" });
  await waitForAppLayoutAfterProvider(page, Math.min(25000, timeoutMs));
  await expectConnectWalletOrDiagnose(page, "dashboardDataReady", Math.min(25000, timeoutMs));
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible()) await connectBtn.click();
  await page.getByRole("button", { name: /disconnect/i }).waitFor({ state: "visible", timeout: 35000 });
  const bar = page.getByTestId("dashboard-kpi-bar").or(page.getByTestId("data-provenance"));
  await bar.first().waitFor({ state: "visible", timeout: Math.min(20000, timeoutMs) });

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const provenance = page.getByTestId("data-provenance");
    const kpiBar = page.getByTestId("dashboard-kpi-bar");
    const blockValue = provenance.locator(".dataProvenanceRow").first().locator(".dataProvenanceValue");
    const blockIsNumeric =
      (await blockValue.isVisible().catch(() => false)) &&
      /^\d+$/.test((await blockValue.textContent())?.trim() ?? "");
    const hasBorrowLimitUsed = await kpiBar
      .locator(".dashboardKpiLimitUsedWrap .dashboardKpiValue")
      .first()
      .evaluate((el) => /\d+/.test(el?.textContent ?? ""))
      .catch(() => false);
    const healthEl = kpiBar.locator(".dashboardKpiHealth .dashboardKpiValue").first();
    const healthNotPlaceholder =
      (await healthEl.isVisible().catch(() => false)) &&
      (await healthEl.evaluate((el) => {
        const t = el?.textContent?.trim();
        return t != null && t !== "—" && (/\d/.test(t) || t === "∞");
      }).catch(() => false));
    const anyKpiNumeric = await kpiBar
      .locator(".dashboardKpiValue")
      .first()
      .evaluate((el) => /\d+/.test(el?.textContent ?? ""))
      .catch(() => false);
    if (blockIsNumeric && (hasBorrowLimitUsed || healthNotPlaceholder || anyKpiNumeric)) return;
    await page.waitForTimeout(400);
  }
  throw new Error(
    `waitForDashboardDataReady: timeout ${timeoutMs}ms — Block numeric and (Borrow limit used % or Health factor not "—") not satisfied`
  );
}

/**
 * Poll until the tx is confirmed (Confirmed / View in Activity / Success).
 * We wait for the receipt state instead of a fixed sleep or long timeout.
 */
export async function waitForTxConfirmed(
  page: import("@playwright/test").Page,
  timeoutMs = 120000
): Promise<void> {
  await page
    .getByText(/Confirmed|View in Activity|Success|transaction.*success/i)
    .first()
    .waitFor({ state: "visible", timeout: timeoutMs });
}

/**
 * Wait for the header wallet state (Connect wallet / Disconnect / Connecting… / Install MetaMask visible); on timeout we run runE2EDiagnostics and throw.
 * After injection we may see Disconnect immediately or Connecting… briefly, so we accept any of these states.
 */
export async function expectConnectWalletOrDiagnose(
  page: import("@playwright/test").Page,
  testTitle?: string,
  timeout = 40000
): Promise<void> {
  const walletButton = page
    .getByRole("button", { name: /connect wallet/i })
    .or(page.getByRole("button", { name: /disconnect/i }))
    .or(page.getByRole("button", { name: /connecting/i }))
    .or(page.getByRole("button", { name: /install metamask/i }));
  try {
    await walletButton.first().waitFor({ state: "visible", timeout });
  } catch {
    await runE2EDiagnostics(page, testTitle);
  }
}

/**
 * Ensure wallet is connected: wait for provider + app-layout (polling), then wallet button, click Connect (or wait for Connecting… to finish), then wait for Disconnect.
 * All key waits are based on real state (provider ready → app-layout visible → button visible → receipt confirmed).
 */
export async function ensureWalletConnected(
  page: import("@playwright/test").Page,
  testTitle?: string,
  timeout = 45000
): Promise<void> {
  await waitForAppLayoutAfterProvider(page, Math.min(30000, timeout));
  await expectConnectWalletOrDiagnose(page, testTitle, timeout);
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible()) {
    await connectBtn.click();
  }
  await page.getByRole("button", { name: /disconnect/i }).waitFor({ state: "visible", timeout: 50000 });
}

/**
 * Zero-trust E2E: we inject in three layers (route from disk into <head> → addInitScript → evaluate+reload as fallback).
 * Route first tries E2E_DIST_INDEX or frontend/dist/index.html from disk and fulfills; if that fails we route.fetch().
 */
export async function injectLocalProvider(page: import("@playwright/test").Page): Promise<void> {
  const distIndexPath =
    process.env.E2E_DIST_INDEX || path.join(process.cwd(), "frontend", "dist", "index.html");

  attachE2EConsoleForwarder(page);

  const initContent =
    "console.log('E2E[addInitScript]: (before) typeof window.ethereum=', typeof window.ethereum);" +
    providerInlineScript(E2E_TEST_ACCOUNT) +
    "console.log('E2E[addInitScript]: (after) typeof window.ethereum=', typeof window.ethereum);";
  await page.context().addInitScript({ content: initContent });

  // Intercept all SPA document requests (any path that serves index.html) so provider is injected on every route.
  const spaDocPredicate = (url: URL): boolean => {
    const p = url.pathname;
    if (p === "" || p === "/") return true;
    // SPA routes: no file extension, single path segment or /admin/...
    if (/^\/(markets|governance|activity|settings|diagnostics|admin)(\/.*)?$/.test(p)) return true;
    if (/^\/markets\/[^/]+$/.test(p)) return true; // /markets/USD8
    return false;
  };

  await page.route(spaDocPredicate, async (route) => {
    const req = route.request();
    if (req.resourceType() !== "document") {
      await route.continue();
      return;
    }
    let body: string;
    try {
      body = fs.readFileSync(distIndexPath, "utf-8");
    } catch {
      try {
        const response = await route.fetch();
        body = await response.text();
      } catch {
        await route.continue();
        return;
      }
    }
    if (!body || !/<head>/i.test(body)) {
      await route.continue();
      return;
    }
    const modified = injectProviderIntoHtml(body, E2E_TEST_ACCOUNT);
    console.log("[E2E route] hit document", route.request().url(), "→ inject <head> → fulfill");
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: modified,
    });
  });
}

export const test = base.extend<object>({});
