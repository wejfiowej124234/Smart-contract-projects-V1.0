import {
  kpiTotalCollateralUsd,
  kpiBorrowLimit,
  kpiBorrowLimitUsed,
  kpiBorrowLimitUsedDenominatorHint,
  kpiBorrowLimitUsedThresholdHint,
  kpiBorrowOverLimitHint,
  kpiAvailableToBorrow,
  kpiNetApy,
  poolTotalSupplyLabel,
  poolTotalBorrowLabel,
  positionHealthFactorLabel,
} from "../../config/ui";
import { formatWithThousandsSeparator, formatBorrowUsagePercent } from "../../utils/format";
import { useValueUpdated } from "../../hooks/useValueUpdated";
import { Tooltip } from "../ui/Tooltip";

export type DashboardKpiBarProps = {
  totalSupply: string;
  totalBorrow: string;
  totalCollateralUsd?: string;
  borrowLimit?: string;
  /** Full-precision value for hover (e.g. 83.3325). */
  borrowLimitTitle?: string;
  /** Borrow limit used 0–100 (denominator: maxBorrowable = LTV cap). Formatted with formatBorrowUsagePercent to avoid 99% misleading. */
  borrowLimitUsedPct?: number;
  availableToBorrow?: string;
  /** Tooltip when availableToBorrow is shown as ≈0 (negligible headroom). */
  availableToBorrowTooltip?: string;
  netApy?: string;
  /** Full-precision for hover. */
  totalSupplyTitle?: string;
  totalBorrowTitle?: string;
  healthFactorDisplay: string;
  healthFactorColor?: string;
  healthFactorBand?: "safe" | "warn" | "danger" | "infinite";
  /** When true, show risk badge/border (e.g. runtime risk tier high). */
  runtimeRiskTierHigh?: boolean;
};

export function DashboardKpiBar({
  totalSupply,
  totalBorrow,
  totalCollateralUsd,
  borrowLimit,
  borrowLimitTitle,
  borrowLimitUsedPct,
  availableToBorrow,
  availableToBorrowTooltip,
  netApy,
  totalSupplyTitle,
  totalBorrowTitle,
  healthFactorDisplay,
  healthFactorColor: healthColor,
  healthFactorBand: band,
  runtimeRiskTierHigh,
}: DashboardKpiBarProps) {
  const supplyClass = useValueUpdated(totalSupply);
  const borrowClass = useValueUpdated(totalBorrow);
  const healthClass = useValueUpdated(healthFactorDisplay);
  const collateralClass = useValueUpdated(totalCollateralUsd ?? "");
  const limitClass = useValueUpdated(borrowLimit ?? "");
  const limitUsedDisplay = borrowLimitUsedPct != null ? formatBorrowUsagePercent(borrowLimitUsedPct) : "";
  const limitUsedClass = useValueUpdated(limitUsedDisplay);
  const availClass = useValueUpdated(availableToBorrow ?? "");
  const netApyClass = useValueUpdated(netApy ?? "");
  const bandClass = band ? `dashboardKpiHealth--${band}` : "";
  const isDanger = band === "danger";
  const limitUsedBand =
    borrowLimitUsedPct != null
      ? borrowLimitUsedPct > 100
        ? "overLimit"
        : borrowLimitUsedPct >= 85
          ? "danger"
          : borrowLimitUsedPct >= 60
            ? "warn"
            : "safe"
      : undefined;
  const limitUsedBandClass = limitUsedBand ? `dashboardKpiLimitUsed--${limitUsedBand}` : "";
  const limitUsedTooltipLine2 = borrowLimitUsedPct != null && borrowLimitUsedPct > 100 ? kpiBorrowOverLimitHint : kpiBorrowLimitUsedThresholdHint;
  return (
    <div
      className={`dashboardKpiBar ${runtimeRiskTierHigh ? "dashboardKpiBar--riskHigh" : ""}`.trim()}
      data-testid="dashboard-kpi-bar"
      role="region"
      aria-label="Key metrics"
    >
      {totalCollateralUsd != null && (
        <div className="dashboardKpiItem">
          <span className="dashboardKpiLabel">{kpiTotalCollateralUsd}</span>
          <span className={`dashboardKpiValue ${collateralClass}`.trim()}>
            {formatWithThousandsSeparator(totalCollateralUsd)}
          </span>
        </div>
      )}
      {borrowLimit != null && (
        <div className="dashboardKpiItem">
          <span className="dashboardKpiLabel">{kpiBorrowLimit}</span>
          <span className={`dashboardKpiValue ${limitClass}`.trim()} title={borrowLimitTitle}>
            {formatWithThousandsSeparator(borrowLimit)}
          </span>
        </div>
      )}
      {borrowLimitUsedPct != null && (
        <Tooltip line1={kpiBorrowLimitUsedDenominatorHint} line2={limitUsedTooltipLine2}>
          <div className={`dashboardKpiItem dashboardKpiLimitUsedWrap ${limitUsedBandClass}`.trim()}>
            <span className="dashboardKpiLabel">{kpiBorrowLimitUsed}</span>
            <div className="dashboardKpiLimitUsedRow">
              <div className="dashboardKpiLimitUsedBar" role="progressbar" aria-valuenow={borrowLimitUsedPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="dashboardKpiLimitUsedBarFill" style={{ width: `${Math.min(100, borrowLimitUsedPct ?? 0)}%` }} />
              </div>
              <span className={`dashboardKpiValue ${limitUsedClass}`.trim()}>{limitUsedDisplay}</span>
            </div>
          </div>
        </Tooltip>
      )}
      {availableToBorrow != null && (
        <div className="dashboardKpiItem">
          <span className="dashboardKpiLabel">{kpiAvailableToBorrow}</span>
          <span className={`dashboardKpiValue ${availClass}`.trim()} title={availableToBorrowTooltip}>
            {formatWithThousandsSeparator(availableToBorrow)}
          </span>
        </div>
      )}
      <div className="dashboardKpiItem">
        <span className="dashboardKpiLabel">{poolTotalSupplyLabel}</span>
        <span className={`dashboardKpiValue ${supplyClass}`.trim()} title={totalSupplyTitle}>{formatWithThousandsSeparator(totalSupply)}</span>
      </div>
      <div className="dashboardKpiItem">
        <span className="dashboardKpiLabel">{poolTotalBorrowLabel}</span>
        <span className={`dashboardKpiValue ${borrowClass}`.trim()} title={totalBorrowTitle}>{formatWithThousandsSeparator(totalBorrow)}</span>
      </div>
      {netApy != null && (
        <div className="dashboardKpiItem">
          <span className="dashboardKpiLabel">{kpiNetApy}</span>
          <span className={`dashboardKpiValue ${netApyClass}`.trim()}>{netApy}</span>
        </div>
      )}
      <div className={`dashboardKpiItem dashboardKpiHealth ${bandClass} ${isDanger ? "dashboardKpiHealth--pulse" : ""}`}>
        <span className="dashboardKpiLabel">{positionHealthFactorLabel}</span>
        <span className={`dashboardKpiValue ${healthClass}`.trim()} style={healthColor ? { color: healthColor } : undefined}>
          {healthFactorDisplay}
        </span>
      </div>
    </div>
  );
}
