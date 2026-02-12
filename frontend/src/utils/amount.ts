import { parseUnits, formatUnits } from "ethers";
import {
  amountErrorRequired,
  amountErrorScientificNotation,
  amountErrorSeparators,
  amountErrorMustBePositive,
  amountErrorInvalidFormat,
  amountErrorTooManyDecimalsTemplate,
  amountErrorMustBeGreaterThanZero,
  amountErrorInvalidAmount,
} from "../config/ui";

export class ValidationError extends Error {
  readonly kind = "Validation" as const;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type ParseAmountResult =
  | { ok: true; value: bigint; normalized: string }
  | { ok: false; error: string };

function normalizeInput(raw: string): string {
  return raw.trim();
}

/**
 * Cleans what the user types so we only allow digits and one decimal point; we also trim to the token’s decimals. Use parseAmountStrict when you need a valid amount for the chain.
 */
export function sanitizeAmountInput(raw: string, decimals: number): string {
  if (!raw) return "";
  const input = raw.replaceAll(",", ".").trim();

  let out = "";
  let seenDot = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const isDigit = ch >= "0" && ch <= "9";
    if (isDigit) {
      out += ch;
      continue;
    }
    if (ch === "." && !seenDot) {
      seenDot = true;
      out += ch;
    }
  }

  if (!out) return "";
  if (out === ".") return "0.";
  if (out.startsWith(".")) out = `0${out}`;

  const dot = out.indexOf(".");
  if (dot === -1) return out;

  const whole = out.slice(0, dot);
  const frac = out.slice(dot + 1);
  return `${whole}.${frac.slice(0, Math.max(0, decimals))}`;
}

/**
 * Strict amount parser (enterprise-safe):
 * - only decimal notation (no scientific notation)
 * - no negative / plus sign
 * - max fractional digits = `decimals`
 * - round-trips via parseUnits (bigint end-to-end)
 */
export function parseAmountStrict(raw: string, decimals: number): ParseAmountResult {
  const input = normalizeInput(raw);
  if (!input) return { ok: false, error: amountErrorRequired };

  // Disallow scientific notation and any non-decimal formatting.
  if (/[eE]/.test(input)) return { ok: false, error: amountErrorScientificNotation };
  if (/[,_\s]/.test(input)) return { ok: false, error: amountErrorSeparators };
  if (input.startsWith("+") || input.startsWith("-")) return { ok: false, error: amountErrorMustBePositive };

  // Allow: "0", "123", "0.1", "123.45". Disallow: ".", "1.", "01e2".
  if (!/^\d+(?:\.\d+)?$/.test(input)) return { ok: false, error: amountErrorInvalidFormat };

  const [, fractional = ""] = input.split(".");
  if (fractional.length > decimals) {
    return { ok: false, error: amountErrorTooManyDecimalsTemplate.replace("{max}", String(decimals)) };
  }

  try {
    const value = parseUnits(input, decimals);
    if (value <= 0n) return { ok: false, error: amountErrorMustBeGreaterThanZero };
    return { ok: true, value, normalized: input };
  } catch {
    return { ok: false, error: amountErrorInvalidAmount };
  }
}

export function requireAmountStrict(raw: string, decimals: number): bigint {
  const r = parseAmountStrict(raw, decimals);
  if (!r.ok) throw new ValidationError(r.error);
  return r.value;
}

export function formatAmount(value: bigint, decimals: number): string {
  return formatUnits(value, decimals);
}

/** Subtracts 1 wei from the max so "Max" buttons don’t hit rounding or reentrancy edge cases on-chain. */
export function safeMaxWei(maxWei: bigint | undefined): bigint | undefined {
  if (maxWei === undefined) return undefined;
  return maxWei > 0n ? maxWei - 1n : 0n;
}
