import { parseUnits, formatUnits } from "ethers";

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
 * Strict amount parser (enterprise-safe):
 * - only decimal notation (no scientific notation)
 * - no negative / plus sign
 * - max fractional digits = `decimals`
 * - round-trips via parseUnits (bigint end-to-end)
 */
export function parseAmountStrict(raw: string, decimals: number): ParseAmountResult {
  const input = normalizeInput(raw);
  if (!input) return { ok: false, error: "Amount is required" };

  // Disallow scientific notation and any non-decimal formatting.
  if (/[eE]/.test(input)) return { ok: false, error: "Scientific notation is not allowed" };
  if (/[,_\s]/.test(input)) return { ok: false, error: "Separators are not allowed" };
  if (input.startsWith("+") || input.startsWith("-")) return { ok: false, error: "Amount must be positive" };

  // Allow: "0", "123", "0.1", "123.45". Disallow: ".", "1.", "01e2".
  if (!/^\d+(?:\.\d+)?$/.test(input)) return { ok: false, error: "Invalid amount format" };

  const [, fractional = ""] = input.split(".");
  if (fractional.length > decimals) {
    return { ok: false, error: `Too many decimal places (max ${decimals})` };
  }

  try {
    const value = parseUnits(input, decimals);
    if (value <= 0n) return { ok: false, error: "Amount must be greater than 0" };
    return { ok: true, value, normalized: input };
  } catch {
    return { ok: false, error: "Invalid amount" };
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
