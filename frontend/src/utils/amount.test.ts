import { describe, expect, it } from "vitest";
import { parseAmountStrict, sanitizeAmountInput } from "./amount";

describe("sanitizeAmountInput", () => {
  it("keeps digits and a single dot", () => {
    expect(sanitizeAmountInput("1.2.3", 18)).toBe("1.23");
    expect(sanitizeAmountInput("ab12x", 18)).toBe("12");
  });

  it("converts comma to dot and trims decimals", () => {
    expect(sanitizeAmountInput("12,3456", 2)).toBe("12.34");
  });

  it("normalizes leading dot", () => {
    expect(sanitizeAmountInput(".", 18)).toBe("0.");
    expect(sanitizeAmountInput(".5", 18)).toBe("0.5");
  });
});

describe("parseAmountStrict", () => {
  it("rejects scientific notation and separators", () => {
    expect(parseAmountStrict("1e3", 18)).toEqual({ ok: false, error: "Scientific notation is not allowed" });
    expect(parseAmountStrict("1,000", 18)).toEqual({ ok: false, error: "Separators are not allowed" });
    expect(parseAmountStrict("1_000", 18)).toEqual({ ok: false, error: "Separators are not allowed" });
  });

  it("rejects invalid formats", () => {
    expect(parseAmountStrict("", 18).ok).toBe(false);
    expect(parseAmountStrict(".", 18)).toEqual({ ok: false, error: "Invalid amount format" });
    expect(parseAmountStrict("1.", 18)).toEqual({ ok: false, error: "Invalid amount format" });
    expect(parseAmountStrict("-1", 18)).toEqual({ ok: false, error: "Amount must be positive" });
  });

  it("enforces max decimals", () => {
    expect(parseAmountStrict("1.234", 2)).toEqual({ ok: false, error: "Too many decimal places (max 2)" });
  });

  it("parses valid positive amounts", () => {
    const r = parseAmountStrict("10.5", 18);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeGreaterThan(0n);
      expect(r.normalized).toBe("10.5");
    }
  });

  it("parses decimal inputs like 11.1 and 111.1 without throwing", () => {
    const r1 = parseAmountStrict("11.1", 18);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.normalized).toBe("11.1");

    const r2 = parseAmountStrict("111.1", 18);
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.normalized).toBe("111.1");
  });
});
