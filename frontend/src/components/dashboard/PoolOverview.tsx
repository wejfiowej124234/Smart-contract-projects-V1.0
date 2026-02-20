import { DEFAULT_DECIMALS } from "../../config/runtime";
import {
  poolTitle,
  poolTotalSupplyLabel,
  poolTotalBorrowLabel,
  poolTotalsLabel,
  poolSuppliedShortLabel,
  poolBorrowedShortLabel,
  poolTotalsUnitTooltipSuffix,
  poolUtilizationRateLabel,
  poolSupplyRateLabel,
  poolBorrowRateLabel,
  utilizationRateTooltip,
  supplyRateTooltip,
  borrowRateTooltip,
  poolEmptyHint,
  poolEmptyCtaLabel,
  emptyPlaceholder,
} from "../../config/ui";
import { formatWithThousandsSeparator, bigintToNumberSafe } from "../../utils/format";
import type { PoolOverviewProps } from "../../types/dashboard";

function fmt(v: string | bigint, formatToken?: (v: bigint, d: number) => string, formatPercent?: (v: bigint) => string): string {
  if (typeof v === "string") return v;
  if (formatPercent && (v === 0n || v > 0n)) return formatPercent(v);
  if (formatToken) return formatToken(v, DEFAULT_DECIMALS);
  return v.toString();
}

function formatNumericDisplay(s: string): string {
  return s === emptyPlaceholder ? s : formatWithThousandsSeparator(s);
}

export function PoolOverview({
  totalSupply,
  totalBorrow,
  utilization,
  supplyRate,
  borrowRate,
  formatToken,
  formatPercent,
  symbol,
}: PoolOverviewProps) {
  const totalSupplyStr = typeof totalSupply === "string" ? totalSupply : (formatToken ? formatToken(totalSupply, DEFAULT_DECIMALS) : totalSupply.toString());
  const totalBorrowStr = typeof totalBorrow === "string" ? totalBorrow : (formatToken ? formatToken(totalBorrow, DEFAULT_DECIMALS) : totalBorrow.toString());
  const utilizationStr = fmt(utilization, formatToken, formatPercent);
  const supplyRateStr = fmt(supplyRate, formatToken, formatPercent);
  const borrowRateStr = fmt(borrowRate, formatToken, formatPercent);
  const isZero = (s: string) => s === "0" || s === "0.00" || (parseFloat(s) === 0 && s !== emptyPlaceholder);
  const isEmpty = isZero(totalSupplyStr) && isZero(totalBorrowStr);
  const displaySupply = formatNumericDisplay(isEmpty ? emptyPlaceholder : totalSupplyStr);
  const displayBorrow = formatNumericDisplay(isEmpty ? emptyPlaceholder : totalBorrowStr);
  const displayUtil = formatNumericDisplay(isEmpty ? emptyPlaceholder : utilizationStr);
  const displaySupplyRate = formatNumericDisplay(supplyRateStr);
  const displayBorrowRate = formatNumericDisplay(borrowRateStr);
  const utilizationNum = bigintToNumberSafe(utilization, 0);
  const utilizationPercent = Math.min(100, Math.max(0, utilizationNum));

  return (
    <div className="card">
      <div className="cardTitle">{poolTitle}</div>
      <div className="poolHero" aria-hidden="true">
        <span className="poolHeroItem">
          <span className="poolHeroLabel" title={supplyRateTooltip}>{poolSupplyRateLabel}</span>
          <span className="poolHeroValue">{displaySupplyRate}</span>
        </span>
        <span className="poolHeroItem">
          <span className="poolHeroLabel" title={borrowRateTooltip}>{poolBorrowRateLabel}</span>
          <span className="poolHeroValue">{displayBorrowRate}</span>
        </span>
      </div>
      <div className="metricGrid metricGrid--market">
        <div className="metricItem">
          <span className="metricLabel" title={utilizationRateTooltip}>{poolUtilizationRateLabel}</span>
          <span className="metricValue">{displayUtil}</span>
        </div>
        <div className="metricItem">
          <span className="metricLabel">
            {poolTotalsLabel}
            {symbol && <span className="metricLabelUnit muted" title={poolTotalsUnitTooltipSuffix}> ({symbol})</span>}
          </span>
          <span className="metricValue muted" title={`${poolTotalSupplyLabel}: ${displaySupply}; ${poolTotalBorrowLabel}: ${displayBorrow}. ${poolTotalsUnitTooltipSuffix}`}>
            {isEmpty ? emptyPlaceholder : `${displaySupply} ${poolSuppliedShortLabel} / ${displayBorrow} ${poolBorrowedShortLabel}`}
          </span>
        </div>
      </div>
      {!isEmpty && (
        <div className="utilizationBar" role="presentation" aria-hidden="true">
          <div className="utilizationBarFill" style={{ width: `${utilizationPercent}%` }} />
        </div>
      )}
      {isEmpty && (
        <div className="emptyStateBlock">
          <p className="muted poolEmptyHint">{poolEmptyHint}</p>
          <button type="button" className="btn btnSecondary btnSmall emptyStateCta" onClick={() => document.getElementById("action-card-supply")?.scrollIntoView({ behavior: "smooth" })}>
            {poolEmptyCtaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
