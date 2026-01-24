import { deployments } from "../contracts/deployments";

// Enterprise note (why): finality differs per environment.
// Local Hardhat: 1 confirmation is enough; public testnets often want 2-5.
export const TX_CONFIRMATIONS: number = deployments.chainId === 31337 ? 1 : 2;

// Pending-tx timeout guardrail.
// Local Hardhat should confirm quickly; real RPCs can be slower and may need longer.
export const TX_PENDING_TIMEOUT_MS: number = deployments.chainId === 31337 ? 30_000 : 120_000;

// Post-state verification budget: after a tx is confirmed, we poll read views briefly
// to ensure UI is not relying on an eventually-consistent refresh alone.
export const POST_STATE_MAX_WAIT_MS: number = deployments.chainId === 31337 ? 2_500 : 10_000;

// Event backfill safety window (queryFilter). Kept intentionally small for demos.
export const EVENT_BACKFILL_MAX_BLOCKS = 2000;
