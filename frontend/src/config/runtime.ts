import { IS_LOCAL_CHAIN } from "./network";

// Enterprise note (why): finality differs per environment.
// Local Hardhat: 1 confirmation is enough; public testnets often want 2-5.
export const TX_CONFIRMATIONS: number = IS_LOCAL_CHAIN ? 1 : 2;

// Pending-tx timeout guardrail.
// Local Hardhat should confirm quickly; real RPCs can be slower and may need longer.
export const TX_PENDING_TIMEOUT_MS: number = IS_LOCAL_CHAIN ? 30_000 : 120_000;

// After a tx confirms we poll read views briefly so the UI doesn’t rely only on a slow refresh.
export const POST_STATE_MAX_WAIT_MS: number = IS_LOCAL_CHAIN ? 2_500 : 10_000;

// Event backfill safety window (queryFilter). Kept intentionally small for demos.
export const EVENT_BACKFILL_MAX_BLOCKS = 2000;

/** Default token decimals when metadata is not yet loaded (e.g. USD8). */
export const DEFAULT_DECIMALS = 18;

/** Oracle price decimals (IOracleRouter.getPrice returns 8 decimals). collateralValue/debtValue when oracle set use this. */
export const ORACLE_PRICE_DECIMALS = 8;

/** Block listener debounce (ms); avoid refreshing too often. */
export const BLOCK_DEBOUNCE_MS = 3000;

/** Delay (ms) before resetting tx state to idle after "confirmed". */
export const TX_IDLE_RESET_DELAY_MS = 2500;

/** Max decimals we show for token amounts so numbers stay readable (used by formatToken and clampDecimalsForDisplay). */
export const DISPLAY_MAX_DECIMALS = 6;

/** Main metrics (totalSupply, totalBorrow, liquidity) use this decimal count in Dashboard and Markets for consistency. */
export const TOKEN_AMOUNT_DECIMALS_MAIN = 2;

/** Headroom below this (in human units) is shown as "≈0" with tooltip to avoid misleading precision. */
export const HEADROOM_NEGLIGIBLE_THRESHOLD = 0.01;

/** Duration (ms) to show "Copied" feedback before resetting (e.g. TxStatus, AddressDisplay). */
export const COPY_FEEDBACK_MS = 1200;

/** useDashboard: throttle delay (ms) for refresh to avoid event burst churn. */
export const REFRESH_THROTTLE_MS = 250;

/** useActions: interval (ms) between post-state verification read retries. */
export const POST_STATE_POLL_INTERVAL_MS = 500;

/** useTxDisplay: interval (ms) for elapsed-time tick (1s). */
export const TX_ELAPSED_INTERVAL_MS = 1000;

/** After this many ms in Signing with no tx hash, show hint to check MetaMask popup/pending. */
export const SIGNING_PENDING_HINT_AFTER_MS = 10_000;

/** Preflight estimateGas/getFeeData timeout (ms). After this, treat as simulationFailed. */
export const PREFLIGHT_GAS_ESTIMATE_TIMEOUT_MS = 8000;
/** Debounce (ms) for amount input before running estimateGas (reduces RPC pressure). */
export const PREFLIGHT_GAS_DEBOUNCE_MS = 300;

/** After wait() times out, poll getTransaction this many times before marking dropped. */
export const TX_DROPPED_POLL_ATTEMPTS = 3;
/** Delay (ms) between existence polls. */
export const TX_DROPPED_POLL_DELAY_MS = 2000;

/** healthFactorColor thresholds (contract: healthFactor = (maxBorrowable * 100) / borrowed). ≥150 green, 110–150 yellow, <100 red. */
export const HEALTH_FACTOR_BORDERLINE = 100;  // < 1.0 = danger
export const HEALTH_FACTOR_WARN = 110;        // 1.1–1.5 = warning
export const HEALTH_FACTOR_SAFE = 150;        // ≥ 1.5 = safe

/** P2.1 useTheme: localStorage key for theme persistence (single source, no magic string in hook). */
export const THEME_STORAGE_KEY = "app-theme";

/** Governance: show Admin link only to these addresses (comma-separated, case-insensitive). Empty = show to all. */
export const ADMIN_ADDRESSES: string[] = (typeof import.meta.env !== "undefined" && import.meta.env?.VITE_ADMIN_ADDRESSES)
  ? String(import.meta.env.VITE_ADMIN_ADDRESSES).split(",").map((a: string) => a.trim().toLowerCase()).filter(Boolean)
  : [];

/** When true, we hide the "Unaudited" warning so that audited deployments can signal compliance. Set via VITE_CONTRACTS_AUDITED=true. */
export const CONTRACTS_AUDITED: boolean =
  typeof import.meta.env !== "undefined" && String(import.meta.env?.VITE_CONTRACTS_AUDITED || "").toLowerCase() === "true";

/** Block freshness: show "N blocks behind" when data block is this many blocks behind chain head. */
export const BLOCK_STALE_THRESHOLD = 3;

/** Runtime risk: when blocks behind exceeds this, tier = high (writes disabled). */
export const BLOCK_STALE_HIGH = 20;

/** When true, we treat mainnet as read-only (no write txs) so that the frontend can be used safely for mainnet. Set via VITE_READ_ONLY_MAINNET=true. */
export const READ_ONLY_MAINNET: boolean =
  typeof import.meta.env !== "undefined" && String(import.meta.env?.VITE_READ_ONLY_MAINNET || "").toLowerCase() === "true";
