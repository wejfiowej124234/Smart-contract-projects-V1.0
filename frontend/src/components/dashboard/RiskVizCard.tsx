import {
  riskVizTitle,
  riskLiquidationPriceLabel,
  riskLiquidationPriceTooltip,
  riskLiquidationThresholdTooltip,
  riskLiquidationMarginUsd,
  riskBorrowUsageLabel,
  riskCurrentLtvLabel,
  riskCurrentLtvTooltip,
  positionHealthFactorLabel,
  healthFactorBadgeThresholdsTooltip,
} from "../../config/ui";
import { healthFactorBand, healthFactorStatusText, formatBorrowUsagePercent, formatWithThousandsSeparator } from "../../utils/format";

const HF_MAX = 200; // display scale 0–200% (2.0)

export type RiskVizCardProps = {
  /** Health factor from contract (100 = 1.0, 150 = 1.5). */
  healthFactor: bigint;
  /** Current collateral value (USD, same unit as liquidation threshold for margin). */
  collateralValue: bigint;
  /** Borrowed amount (same unit as collateral for ratio). */
  borrowed: bigint;
  /** Headroom: max additional borrow (contract calculateMaxBorrow). */
  maxBorrow: bigint;
  /** LTV cap: maxBorrowable = borrowed + maxBorrow; used for Borrow usage % and Current LTV denominator. */
  maxBorrowable: bigint;
  /** Liquidation threshold % (e.g. 80). */
  ltPct: number;
  /** Max LTV % (e.g. 75) for Current LTV row. */
  ltvPct?: number;
  /** Format USD for display (e.g. from formatUnits with 8). */
  formatUsd: (v: bigint) => string;
};

export function RiskVizCard({
  healthFactor,
  collateralValue,
  borrowed,
  maxBorrow,
  maxBorrowable,
  ltPct,
  ltvPct,
  formatUsd,
}: RiskVizCardProps) {
  const band = healthFactorBand(healthFactor);
  const isInfinite =
    healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  const hfNum = isInfinite ? 200 : Number(healthFactor);
  const hfPercent = Math.min(hfNum, HF_MAX);
  // Liquidation threshold value: min collateral (in same unit as collateralValue) at which HF would hit 1.0.
  // Contract: HF = (collateralValue * lt) / debtValue => at liquidation, collateralValue = debtValue * 100 / lt = (collateralValue * lt / HF) * 100 / lt = collateralValue * 100 / HF.
  // When oracle set: collateralValue is 8 decimals (USD, IOracleRouter.getPrice 8 decimals); when not set, 18 (token). formatUsd from parent must match (8 for oracle path).
  const liquidationThresholdValue =
    !isInfinite && healthFactor > 0n && collateralValue > 0n
      ? (collateralValue * 100n) / healthFactor
      : 0n;
  const marginValue = collateralValue > liquidationThresholdValue ? collateralValue - liquidationThresholdValue : 0n;
  const borrowUsagePctRaw =
    maxBorrowable > 0n ? Math.min(100, Number((borrowed * 1000000n) / maxBorrowable) / 10000) : 0;
  const borrowUsagePctDisplay = formatBorrowUsagePercent(borrowUsagePctRaw);
  /** Ring color follows position risk tier (At risk = warn/yellow, Critical = danger/red) so text and graphic align. */
  const ringBand = band === "infinite" ? "safe" : band;
  const rawLtvPct =
    maxBorrowable > 0n && (ltvPct ?? 0) > 0
      ? (Number((borrowed * 100n) / maxBorrowable) / 100) * (ltvPct ?? 0)
      : undefined;
  const currentLtvPct =
    rawLtvPct != null && rawLtvPct <= 10000 && Number.isFinite(rawLtvPct) ? rawLtvPct : undefined;

  return (
    <div className="card riskVizCard" data-testid="risk-viz-card" role="region" aria-label={riskVizTitle}>
      <h3 className="cardTitle riskVizCardTitle">{riskVizTitle}</h3>
      <div className="riskVizGrid">
        <div className="riskVizItem">
          <span className="riskVizLabel">{positionHealthFactorLabel}</span>
          <div className="riskVizHfBarWrap" role="progressbar" aria-valuenow={hfPercent} aria-valuemin={0} aria-valuemax={HF_MAX} aria-label={`Health factor ${(hfNum / 100).toFixed(2)}`}>
            <div className="riskVizHfBar riskVizHfBar--track">
              <div
                className={`riskVizHfBar riskVizHfBar--fill riskVizHfBar--${band}`}
                style={{ width: `${hfPercent}%` }}
              />
            </div>
            <span className="riskVizHfBarLegend">
              {isInfinite ? "∞" : `${(hfNum / 100).toFixed(2)}`}
            </span>
          </div>
          <span className={`riskVizHfBadge riskVizHfBadge--${band}`} role="status" title={healthFactorBadgeThresholdsTooltip}>
            {healthFactorStatusText(healthFactor)}
          </span>
        </div>
        <div className="riskVizItem">
          <span className="riskVizLabel" title={riskLiquidationPriceTooltip}>
            {riskLiquidationPriceLabel} (USD)
          </span>
          <span className="riskVizValue riskVizValue--liquidation">
            {liquidationThresholdValue > 0n
              ? formatWithThousandsSeparator(formatUsd(liquidationThresholdValue))
              : "—"}
          </span>
          {ltPct > 0 && liquidationThresholdValue > 0n && (
            <span className="riskVizSubLabel muted" title={riskLiquidationThresholdTooltip}>
              Liquidation threshold {ltPct}%
            </span>
          )}
        </div>
        {marginValue > 0n && (
          <div className="riskVizItem">
            <span className="riskVizLabel" title={riskLiquidationMarginUsd}>
              {riskLiquidationMarginUsd}
            </span>
            <span className="riskVizValue riskVizValue--margin">
              {formatWithThousandsSeparator(formatUsd(marginValue))} USD
            </span>
          </div>
        )}
        {currentLtvPct != null && (ltvPct ?? 0) > 0 && (
          <div className="riskVizItem">
            <span className="riskVizLabel" title={riskCurrentLtvTooltip}>{riskCurrentLtvLabel}</span>
            <span className="riskVizValue">{currentLtvPct.toFixed(1)}% / {(ltvPct ?? 0).toFixed(1)}%</span>
          </div>
        )}
        <div className="riskVizItem riskVizItem--ring">
          <span className="riskVizLabel">{riskBorrowUsageLabel}</span>
          <div className="riskVizRingWrap" role="progressbar" aria-valuenow={borrowUsagePctRaw} aria-valuemin={0} aria-valuemax={100}>
            <svg className="riskVizRing" viewBox="0 0 36 36">
              <path
                className="riskVizRingTrack"
                d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                fill="none"
                strokeWidth="3"
                pathLength={100}
              />
              <path
                className={`riskVizRingFill riskVizRingFill--${borrowUsagePctRaw > 100 ? "danger" : ringBand}`}
                strokeDasharray={`${Math.min(100, borrowUsagePctRaw)} 100`}
                d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                fill="none"
                strokeWidth="3"
                pathLength={100}
              />
            </svg>
            <span className="riskVizRingValue">{borrowUsagePctDisplay}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
