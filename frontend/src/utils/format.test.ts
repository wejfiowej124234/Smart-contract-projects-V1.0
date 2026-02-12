import { describe, expect, it } from "vitest";
import { bigintToNumberSafe, formatHealthFactorForDisplay, formatWithThousandsSeparator } from "./format";

const HF_MAX = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

describe("bigintToNumberSafe", () => {
  it("returns fallback for undefined and null", () => {
    expect(bigintToNumberSafe(undefined)).toBe(0);
    expect(bigintToNumberSafe(undefined, 42)).toBe(42);
    expect(bigintToNumberSafe(null)).toBe(0);
    expect(bigintToNumberSafe(null, 1)).toBe(1);
  });

  it("converts number safely", () => {
    expect(bigintToNumberSafe(0)).toBe(0);
    expect(bigintToNumberSafe(100)).toBe(100);
    expect(bigintToNumberSafe(50.5)).toBe(50.5);
    expect(bigintToNumberSafe(Infinity, 0)).toBe(0);
    expect(bigintToNumberSafe(NaN, 0)).toBe(0);
  });

  it("converts bigint safely (avoids Math/BigInt mix)", () => {
    expect(bigintToNumberSafe(0n)).toBe(0);
    expect(bigintToNumberSafe(100n)).toBe(100);
    expect(bigintToNumberSafe(2n)).toBe(2);
  });

  it("converts string numbers", () => {
    expect(bigintToNumberSafe("0")).toBe(0);
    expect(bigintToNumberSafe("11.1")).toBe(11.1);
    expect(bigintToNumberSafe("111.1")).toBe(111.1);
    expect(bigintToNumberSafe("invalid", 0)).toBe(0);
  });
});

describe("formatHealthFactorForDisplay", () => {
  it("returns No debt for infinite health factor", () => {
    expect(formatHealthFactorForDisplay(HF_MAX)).toBe("No debt");
  });

  it("displays contract value as ratio (divide by 100)", () => {
    expect(formatHealthFactorForDisplay(100n)).toBe("1.0");
    expect(formatHealthFactorForDisplay(120n)).toBe("1.20");
    expect(formatHealthFactorForDisplay(150n)).toBe("1.50");
    expect(formatHealthFactorForDisplay(250n)).toBe("2.50");
  });
});

describe("formatWithThousandsSeparator", () => {
  it("returns empty string for null and coerces non-string", () => {
    expect(formatWithThousandsSeparator(null as unknown as string)).toBe("");
    expect(formatWithThousandsSeparator(123n as unknown as string)).toBe("123");
  });
});
