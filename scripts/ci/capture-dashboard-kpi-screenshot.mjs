#!/usr/bin/env node
/**
 * Capture Dashboard KPI bar (Borrow limit used tooltip) as evidence screenshot.
 * Run after frontend is built and served (e.g. npm run dev or npx vite preview).
 * Writes: evidence-pack/screenshots/dashboard-kpi-borrow-limit-used.png
 * Then run generate-evidence-pack.mjs to include it in manifest with sha256.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const PACK_DIR = process.env.EVIDENCE_PACK_DIR || path.join(ROOT, "evidence-pack");
const SCREENSHOTS_DIR = path.join(PACK_DIR, "screenshots");
const OUT_FILE = path.join(SCREENSHOTS_DIR, "dashboard-kpi-borrow-limit-used.png");
const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";

async function main() {
  const { chromium } = await import("@playwright/test");
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle", timeout: 15000 });
    const kpiBar = page.locator("[data-testid=dashboard-kpi-bar]");
    await kpiBar.waitFor({ state: "visible", timeout: 10000 }).catch(() => null);
    if (await kpiBar.isVisible()) {
      await kpiBar.screenshot({ path: OUT_FILE });
    } else {
      await page.screenshot({ path: OUT_FILE, fullPage: false });
    }
    await browser.close();
    console.log("[capture-dashboard-kpi] Saved:", OUT_FILE);
  } catch (e) {
    await browser.close();
    console.error("[capture-dashboard-kpi] Failed:", e.message);
    process.exitCode = 1;
  }
}

main();
