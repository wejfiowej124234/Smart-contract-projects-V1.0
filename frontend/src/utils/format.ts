import { getAddress } from "ethers";
import {
  shortAddressPrefixLen,
  shortAddressSuffixLen,
  healthFactorStatusHealthy,
  healthFactorStatusWarning,
  healthFactorStatusDanger,
  healthFactorStatusInfinite,
} from "../config/ui";
import { HEALTH_FACTOR_BORDERLINE, HEALTH_FACTOR_WARN } from "../config/runtime";

/** Normalizes an address to EIP-55 checksum so it’s consistent everywhere; falls back to the original if invalid. */
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
  // Contract uses healthFactor = (maxBorrowable * 100) / borrowed
  if (healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
    return "var(--primary)"; // infinite (no borrow)
  }
  if (healthFactor < BigInt(HEALTH_FACTOR_BORDERLINE)) return "var(--danger)";
  if (healthFactor < BigInt(HEALTH_FACTOR_WARN)) return "var(--warning)";
  return "var(--success)";
}

/** Returns status text for health factor so screen readers and copy don’t rely on color alone. */
export function healthFactorStatusText(healthFactor: bigint): string {
  if (healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
    return healthFactorStatusInfinite;
  }
  if (healthFactor < BigInt(HEALTH_FACTOR_BORDERLINE)) return healthFactorStatusDanger;
  if (healthFactor < BigInt(HEALTH_FACTOR_WARN)) return healthFactorStatusWarning;
  return healthFactorStatusHealthy;
}

/** Clamps fractional digits for display so we don’t add unnecessary trailing zeros. */
export function clampDecimalsForDisplay(raw: string, maxDecimals: number): string {
  if (!raw.includes(".")) return raw;
  const [w, f = ""] = raw.split(".");
  const frac = f.slice(0, Math.max(0, maxDecimals));
  const trimmed = frac.replace(/0+$/u, "");
  return trimmed ? `${w}.${trimmed}` : w;
}

/** Formats a number with thousands separators (e.g. 10,000.5). Leaves non-numeric or placeholder text unchanged. */
export function formatWithThousandsSeparator(s: string): string {
  if (!s || s.trim() === "") return s;
  const trimmed = s.trim();
  if (trimmed.includes(",")) return s;
  if (!/^-?\d+(\.\d*)?$/.test(trimmed)) return s;
  const hasMinus = trimmed.startsWith("-");
  const rest = hasMinus ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart] = rest.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = fracPart !== undefined ? `${withCommas}.${fracPart}` : withCommas;
  return hasMinus ? `-${out}` : out;
}

/** Formats a timestamp as local time HH:MM:SS for display. */
export function formatLocalTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
