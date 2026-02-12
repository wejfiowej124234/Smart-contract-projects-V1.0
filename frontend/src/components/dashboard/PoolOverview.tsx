import { DEFAULT_DECIMALS } from "../../config/runtime";
import {
  poolTitle,
  poolTotalSupplyLabel,
  poolTotalBorrowLabel,
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
import { formatWithThousandsSeparator } from "../../utils/format";
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
}: PoolOverviewProps) {
  const totalSupplyStr = typeof totalSupply === "string" ? totalSupply : (formatToken ? formatToken(totalSupply, DEFAULT_DECIMALS) : totalSupply.toString());
  const totalBorrowStr = typeof totalBorrow === "string" ? totalBorrow : (formatToken ? formatToken(totalBorrow, DEFAULT_DECIMALS) : totalBorrow.toString());
  const utilizationStr = fmt(utilization, formatToken, formatPercent);
  const supplyRateStr = fmt(supplyRate, formatToken, formatPercent);
  const borrowRateStr = fmt(borrowRate, formatToken, formatPercent);
  const isEmpty = totalSupplyStr === "0" && totalBorrowStr === "0";
  const displaySupply = formatNumericDisplay(isEmpty ? emptyPlaceholder : totalSupplyStr);
  const displayBorrow = formatNumericDisplay(isEmpty ? emptyPlaceholder : totalBorrowStr);
  const displayUtil = formatNumericDisplay(isEmpty ? emptyPlaceholder : utilizationStr);
  const displaySupplyRate = formatNumericDisplay(supplyRateStr);
  const displayBorrowRate = formatNumericDisplay(borrowRateStr);
  const utilizationNum = typeof utilization === "bigint" ? Number(utilization) : 0;
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
          <span className="metricLabel">{poolTotalSupplyLabel}</span>
          <span className="metricValue">{displaySupply}</span>
        </div>
        <div className="metricItem">
          <span className="metricLabel">{poolTotalBorrowLabel}</span>
          <span className="metricValue">{displayBorrow}</span>
        </div>
        <div className="metricItem">
          <span className="metricLabel" title={utilizationRateTooltip}>{poolUtilizationRateLabel}</span>
          <span className="metricValue">{displayUtil}</span>
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
