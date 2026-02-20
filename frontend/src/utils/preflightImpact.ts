/**
 * Preflight risk impact: compute Before / After and deltas for HF, borrow usage, liquidation margin.
 * Contract: healthFactor = (maxBorrowable * 100) / borrowed; 100 = 1.0.
 * Borrow usage = borrowed / maxBorrowable (LTV cap); maxBorrowable = borrowed + maxBorrow (headroom).
 */

import type { PreflightAction } from "../types/dashboard";

const HF_INFINITE = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export type RiskImpactRow = {
  label: string;
  before: string;
  after: string;
  delta: string;
  worse: boolean;
};

export type PreflightImpact = {
  rows: RiskImpactRow[];
  /** When true, at least one metric worsens (for overall warning). */
  anyWorse: boolean;
};

type Position = {
  supplied: bigint;
  borrowed: bigint;
  collateralValue: bigint;
  healthFactor: bigint;
  /** Headroom from contract calculateMaxBorrow. */
  maxBorrow: bigint;
  /** LTV cap = borrowed + maxBorrow; used as denominator for borrow usage %. */
  maxBorrowable?: bigint;
};

export function computePreflightImpact(
  action: PreflightAction,
  amountWei: bigint,
  position: Position,
  ltPct: number,
  _ltvPct: number,
  formatHf: (hf: bigint) => string,
  formatPct: (n: number) => string,
  formatUsd: (v: bigint) => string,
): PreflightImpact | null {
  const { borrowed, collateralValue, healthFactor, maxBorrow } = position;
  const maxBorrowable = position.maxBorrowable ?? borrowed + maxBorrow;
  if (ltPct <= 0) return null;

  const beforeBorrowUsagePct = maxBorrowable > 0n ? Number((borrowed * 1000000n) / maxBorrowable) / 10000 : 0;
  const beforeMargin = borrowed > 0n ? collateralValue - (borrowed * BigInt(100)) / BigInt(ltPct) : collateralValue;
  const beforeHfStr = healthFactor === HF_INFINITE ? "∞" : formatHf(healthFactor);

  let afterHf: bigint;
  let afterBorrowUsagePct: number;
  let afterMargin: bigint;

  switch (action) {
    case "Borrow": {
      const afterBorrowed = borrowed + amountWei;
      afterHf = afterBorrowed > 0n ? (maxBorrowable * 100n) / afterBorrowed : HF_INFINITE;
      afterBorrowUsagePct = maxBorrowable > 0n ? Math.min(100, Number((afterBorrowed * 1000000n) / maxBorrowable) / 10000) : 0;
      afterMargin = afterBorrowed > 0n ? collateralValue - (afterBorrowed * BigInt(100)) / BigInt(ltPct) : collateralValue;
      break;
    }
    case "Repay": {
      const afterBorrowed = borrowed > amountWei ? borrowed - amountWei : 0n;
      afterHf = afterBorrowed === 0n ? HF_INFINITE : (maxBorrowable * 100n) / afterBorrowed;
      afterBorrowUsagePct = maxBorrowable > 0n && afterBorrowed > 0n ? Number((afterBorrowed * 1000000n) / maxBorrowable) / 10000 : 0;
      afterMargin = afterBorrowed > 0n ? collateralValue - (afterBorrowed * BigInt(100)) / BigInt(ltPct) : collateralValue;
      break;
    }
    case "Supply": {
      const collateralDecimals = 8;
      const supplyDecimals = 18;
      const scale = 10n ** BigInt(supplyDecimals - collateralDecimals);
      const deltaCollateral = amountWei / scale;
      const newCollateral = collateralValue + deltaCollateral;
      const newMaxBorrow = (newCollateral * BigInt(ltPct)) / 100n;
      afterHf = borrowed > 0n ? (newMaxBorrow * 100n) / borrowed : HF_INFINITE;
      afterBorrowUsagePct = newMaxBorrow > 0n ? Number((borrowed * 1000000n) / newMaxBorrow) / 10000 : 0;
      afterMargin = borrowed > 0n ? newCollateral - (borrowed * BigInt(100)) / BigInt(ltPct) : newCollateral;
      break;
    }
    case "Withdraw": {
      const collateralDecimals = 8;
      const supplyDecimals = 18;
      const scale = 10n ** BigInt(supplyDecimals - collateralDecimals);
      const deltaCollateral = amountWei / scale;
      const newCollateral = collateralValue > deltaCollateral ? collateralValue - deltaCollateral : 0n;
      const newMaxBorrow = (newCollateral * BigInt(ltPct)) / 100n;
      afterHf = borrowed > 0n && newMaxBorrow > 0n ? (newMaxBorrow * 100n) / borrowed : (borrowed > 0n ? 0n : HF_INFINITE);
      afterBorrowUsagePct = newMaxBorrow > 0n ? Math.min(100, Number((borrowed * 1000000n) / newMaxBorrow) / 10000) : 100;
      afterMargin = borrowed > 0n ? newCollateral - (borrowed * BigInt(100)) / BigInt(ltPct) : newCollateral;
      break;
    }
    default:
      return null;
  }

  const afterHfStr = afterHf === HF_INFINITE ? "∞" : formatHf(afterHf);
  const hfWorse = afterHf !== HF_INFINITE && healthFactor !== HF_INFINITE && afterHf < healthFactor;
  const usageWorse = afterBorrowUsagePct > beforeBorrowUsagePct;
  const marginWorse = afterMargin < beforeMargin;

  const rows: RiskImpactRow[] = [
    {
      label: "Health factor",
      before: beforeHfStr,
      after: afterHfStr,
      delta: beforeHfStr === "∞" && afterHfStr === "∞" ? "—" : (afterHfStr !== "∞" && beforeHfStr !== "∞" ? deltaStr(beforeHfStr, afterHfStr) : afterHfStr),
      worse: hfWorse,
    },
    {
      label: "Borrow usage",
      before: formatPct(beforeBorrowUsagePct),
      after: formatPct(afterBorrowUsagePct),
      delta: deltaStr(formatPct(beforeBorrowUsagePct), formatPct(afterBorrowUsagePct)),
      worse: usageWorse,
    },
    {
      label: "Safety margin (USD)",
      before: formatUsd(beforeMargin),
      after: formatUsd(afterMargin),
      delta: formatMarginDelta(beforeMargin, afterMargin, formatUsd),
      worse: marginWorse,
    },
  ];

  return {
    rows,
    anyWorse: hfWorse || usageWorse || marginWorse,
  };
}

function deltaStr(before: string, after: string): string {
  if (before === "∞" || after === "∞") return after === before ? "—" : after;
  const b = parseFloat(String(before).replace(/,/g, ""));
  const a = parseFloat(String(after).replace(/,/g, ""));
  if (Number.isFinite(b) && Number.isFinite(a)) {
    const d = a - b;
    const sign = d > 0 ? "+" : "";
    return `${sign}${d.toFixed(2)}`;
  }
  return after;
}

function formatMarginDelta(before: bigint, after: bigint, formatUsd: (v: bigint) => string): string {
  const diff = after - before;
  if (diff === 0n) return "—";
  if (diff > 0n) return `+${formatUsd(diff)}`;
  return `-${formatUsd(-diff)}`;
}
