import { formatUnits, getAddress } from "ethers";
import {
  shortAddressPrefixLen,
  shortAddressSuffixLen,
  healthFactorStatusHealthy,
  healthFactorStatusWarning,
  healthFactorStatusDanger,
  healthFactorStatusInfinite,
} from "../config/ui";
import { HEALTH_FACTOR_BORDERLINE, HEALTH_FACTOR_SAFE, DISPLAY_MAX_DECIMALS, HEADROOM_NEGLIGIBLE_THRESHOLD } from "../config/runtime";

/** Normalizes an address to EIP-55 checksum so it’s consistent everywhere; falls back to the original if invalid. */
/** Block timestamp (chain, seconds) → "Xs ago" / "just now" / "~0s ago" (negative delta = client ahead). */
export function formatBlockTimestampAgo(blockTimestamp: number | undefined): string {
  if (blockTimestamp == null) return "";
  const nowSec = Math.floor(Date.now() / 1000);
  const delta = nowSec - blockTimestamp;
  if (delta < 0) return "~0s ago";
  if (delta < 60) return delta === 0 ? "just now" : `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)} min ago`;
  return `${Math.floor(delta / 3600)}h ago`;
}

export function toChecksum(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}

export function shortAddress(address: string): string {
  return `${address.slice(0, shortAddressPrefixLen)}…${address.slice(-shortAddressSuffixLen)}`;
}

export function healthFactorColor(healthFactor: bigint): string {
  // Contract: healthFactor = (maxBorrowable * 100) / borrowed. ≥1.5 green, 1.1–1.5 yellow, <1 red.
  if (healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
    return "var(--success)"; // infinite (no borrow) = safe
  }
  if (healthFactor < BigInt(HEALTH_FACTOR_BORDERLINE)) return "var(--danger)";
  if (healthFactor < BigInt(HEALTH_FACTOR_SAFE)) return "var(--warning)";
  return "var(--success)";
}

/** CSS band for health factor: --safe (≥1.5), --warn (1.1–1.5), --danger (<1). For animation/glow. */
export function healthFactorBand(healthFactor: bigint): "safe" | "warn" | "danger" | "infinite" {
  const max = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  if (healthFactor === max) return "infinite";
  if (healthFactor < BigInt(HEALTH_FACTOR_BORDERLINE)) return "danger";
  if (healthFactor < BigInt(HEALTH_FACTOR_SAFE)) return "warn";
  return "safe";
}

/** Returns status text for health factor so screen readers and copy don’t rely on color alone. */
export function healthFactorStatusText(healthFactor: bigint): string {
  if (healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
    return healthFactorStatusInfinite;
  }
  if (healthFactor < BigInt(HEALTH_FACTOR_BORDERLINE)) return healthFactorStatusDanger;
  if (healthFactor < BigInt(HEALTH_FACTOR_SAFE)) return healthFactorStatusWarning;
  return healthFactorStatusHealthy;
}

/** Contract stores healthFactor = (maxBorrowable * 100) / borrowed; display as ratio e.g. "1.00" not "100". */
export function formatHealthFactorForDisplay(healthFactor: bigint): string {
  const max = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  if (healthFactor === max) return healthFactorStatusInfinite;
  const n = Number(healthFactor);
  if (!Number.isFinite(n) || n < 0) return "0.00";
  const ratio = n / 100;
  return ratio % 1 === 0 ? ratio.toFixed(1) : ratio.toFixed(2);
}

/** Clamps fractional digits for display so we don’t add unnecessary trailing zeros. */
/** Safely convert bigint/number/string to number for Math/CSS (avoids "Cannot convert a BigInt value to a number"). */
export function bigintToNumberSafe(value: unknown, fallback = 0): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof value === "bigint") {
    try {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function clampDecimalsForDisplay(raw: string, maxDecimals: number | bigint): string {
  if (!raw.includes(".")) return raw;
  const [w, f = ""] = raw.split(".");
  const max = typeof maxDecimals === "bigint" ? Number(maxDecimals) : maxDecimals;
  const frac = f.slice(0, Math.max(0, max));
  const trimmed = frac.replace(/0+$/u, "");
  return trimmed ? `${w}.${trimmed}` : w;
}

/** Formats a number with thousands separators (e.g. 10,000.5). Leaves non-numeric or placeholder text unchanged. */
export function formatWithThousandsSeparator(s: string): string {
  if (s == null) return "";
  if (typeof s !== "string") return String(s);
  const trimmed = s.trim();
  if (trimmed === "") return s;
  if (trimmed.includes(",")) return s;
  if (!/^-?\d+(\.\d*)?$/.test(trimmed)) return s;
  const hasMinus = trimmed.startsWith("-");
  const rest = hasMinus ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart] = rest.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = fracPart !== undefined ? `${withCommas}.${fracPart}` : withCommas;
  return hasMinus ? `-${out}` : out;
}

/** Single strategy for token/amount display: max decimals + thousands separator. Use across Balances, Pool, Position, Markets. */
export function formatAmountForDisplay(
  wei: bigint,
  decimals: number,
  maxDecimals: number = DISPLAY_MAX_DECIMALS,
): string {
  const raw = formatUnits(wei, decimals);
  const clamped = clampDecimalsForDisplay(raw, maxDecimals);
  return formatWithThousandsSeparator(clamped);
}

/** Compact form for very large amounts (e.g. 1.23M, 4.56K). Use when space is limited or value >= threshold. */
export function formatAmountCompact(wei: bigint, decimals: number): string {
  const n = Number(formatUnits(wei, decimals));
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= 1e9) return `${clampDecimalsForDisplay(String(n / 1e9), 2)}B`;
  if (n >= 1e6) return `${clampDecimalsForDisplay(String(n / 1e6), 2)}M`;
  if (n >= 1e3) return `${clampDecimalsForDisplay(String(n / 1e3), 2)}K`;
  return clampDecimalsForDisplay(String(n), DISPLAY_MAX_DECIMALS);
}

/**
 * Unified amount display with extreme-value strategy: below threshold use full decimals + thousands;
 * at or above threshold use compact (K/M/B). Use across Balances, Pool, Position, Markets for consistency.
 */
export function formatAmountForDisplayWithStrategy(
  wei: bigint,
  decimals: number,
  opts?: { maxDecimals?: number; compactAbove?: number },
): string {
  const maxDecimals = opts?.maxDecimals ?? DISPLAY_MAX_DECIMALS;
  const compactAbove = opts?.compactAbove ?? 999_999; // 1M+ → compact
  const n = Number(formatUnits(wei, decimals));
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= compactAbove) return formatAmountCompact(wei, decimals);
  const raw = formatUnits(wei, decimals);
  const clamped = clampDecimalsForDisplay(raw, maxDecimals);
  return formatWithThousandsSeparator(clamped);
}

/** Formats a timestamp as local time HH:MM:SS for display. */
export function formatLocalTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Borrow usage / limit used percentage: avoid misleading "99%" when near 100%.
 * Rule: >100% → "100%+"; ≥100% or ≥99.95% → "100%"; 99% ≤ pct < 99.95% → one decimal; else integer.
 */
export function formatBorrowUsagePercent(pct: number): string {
  if (!Number.isFinite(pct) || pct < 0) return "0%";
  if (pct > 100) return "100%+";
  if (pct >= 100 || pct >= 99.95) return "100%";
  if (pct >= 99) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

/**
 * Headroom (maxBorrow / maxWithdraw / available to borrow): when negligible, show "≈0" with tooltip.
 * Threshold from HEADROOM_NEGLIGIBLE_THRESHOLD (human units).
 */
export function formatHeadroomDisplay(
  wei: bigint,
  decimals: number,
  formatToken: (v: bigint, d: number) => string,
  threshold: number = HEADROOM_NEGLIGIBLE_THRESHOLD,
): { display: string; tooltip: string | undefined } {
  if (wei === 0n) return { display: "0", tooltip: undefined };
  const n = Number(formatUnits(wei, decimals));
  if (!Number.isFinite(n) || n < threshold) return { display: "≈0", tooltip: headroomNegligibleTooltip };
  return { display: formatToken(wei, decimals), tooltip: undefined };
}

/** Tooltip when headroom is shown as ≈0 (single source for UI). */
export const headroomNegligibleTooltip = "Headroom (maxBorrowable − borrowed). Remaining headroom negligible; at or near limit. At/near cap: borrowed ≈ maxBorrowable.";
