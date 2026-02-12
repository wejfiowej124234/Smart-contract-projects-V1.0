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

/** Block listener debounce (ms); avoid refreshing too often. */
export const BLOCK_DEBOUNCE_MS = 3000;

/** Delay (ms) before resetting tx state to idle after "confirmed". */
export const TX_IDLE_RESET_DELAY_MS = 2500;

/** Max decimals we show for token amounts so numbers stay readable (used by formatToken and clampDecimalsForDisplay). */
export const DISPLAY_MAX_DECIMALS = 6;

/** Duration (ms) to show "Copied" feedback before resetting (e.g. TxStatus, AddressDisplay). */
export const COPY_FEEDBACK_MS = 1200;

/** useDashboard: throttle delay (ms) for refresh to avoid event burst churn. */
export const REFRESH_THROTTLE_MS = 250;

/** useActions: interval (ms) between post-state verification read retries. */
export const POST_STATE_POLL_INTERVAL_MS = 500;

/** useTxDisplay: interval (ms) for elapsed-time tick (1s). */
export const TX_ELAPSED_INTERVAL_MS = 1000;

/** healthFactorColor thresholds (contract: healthFactor = (maxBorrowable * 100) / borrowed). */
export const HEALTH_FACTOR_BORDERLINE = 100;
export const HEALTH_FACTOR_WARN = 120;

/** P2.1 useTheme: localStorage key for theme persistence (single source, no magic string in hook). */
export const THEME_STORAGE_KEY = "app-theme";
