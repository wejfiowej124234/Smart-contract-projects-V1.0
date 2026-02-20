import { defineConfig, devices } from "@playwright/test";

/** Local E2E: frontend at http://127.0.0.1:5173, chain at http://127.0.0.1:8545 (per docs/09). No external network. Zero-trust: screenshots/traces go to e2e/evidence/playwright-test-results/ in CI. */
/** Tiers (Aave/Compound-style): smoke ~10s | core-flow on local chain | full forensic CI nightly. */
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  /** Under CI we write relative to e2e/, i.e. e2e/evidence/playwright-test-results/ */
  outputDir: process.env.CI ? "evidence/playwright-test-results" : "test-results",
  projects: [
    {
      name: "smoke",
      grep: /@smoke/,
      timeout: 15000,
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? { channel: "chrome" as const } : {}),
      },
    },
    {
      name: "core-flow",
      grep: /@core-flow/,
      timeout: 120000,
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? { channel: "chrome" as const } : {}),
      },
    },
    {
      name: "tx-heavy",
      grep: /@tx-heavy/,
      timeout: 300000,
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? { channel: "chrome" as const } : {}),
      },
    },
    {
      name: "forensic",
      grep: /@forensic/,
      timeout: 120000,
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? { channel: "chrome" as const } : {}),
      },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? { channel: "chrome" as const } : {}),
      },
    },
  ],
  timeout: 60000,
});
