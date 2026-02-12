import { DEFAULT_DECIMALS } from "../../config/runtime";
import {
  userPositionTitle,
  positionSuppliedLabel,
  positionBorrowedLabel,
  positionHealthFactorLabel,
  positionMaxWithdrawLabel,
  positionMaxBorrowLabel,
  healthFactorStatusDanger,
  healthFactorStatusWarning,
  healthFactorStatusInfinite,
  healthFactorTooltip,
  healthFactorThresholdHint,
  healthFactorWarnThresholdLabel,
  healthFactorDangerThresholdLabel,
  healthFactorCriticalHint,
  maxWithdrawTooltip,
  positionEmptyHint,
  positionEmptyCtaLabel,
  emptyPlaceholder,
} from "../../config/ui";
import { healthFactorColor, healthFactorStatusText, formatWithThousandsSeparator } from "../../utils/format";
import type { UserPositionProps } from "../../types/dashboard";

export function UserPosition({
  supplied,
  borrowed,
  healthFactor,
  maxWithdraw,
  maxBorrow,
  healthColor,
  formatToken,
}: UserPositionProps) {
  const suppliedStr = typeof supplied === "string" ? supplied : (formatToken ? formatToken(supplied, DEFAULT_DECIMALS) : supplied.toString());
  const borrowedStr = typeof borrowed === "string" ? borrowed : (formatToken ? formatToken(borrowed, DEFAULT_DECIMALS) : borrowed.toString());
  const healthVal = typeof healthFactor === "string" ? healthFactor : healthFactor.toString();
  const color = healthColor ?? (typeof healthFactor === "bigint" ? healthFactorColor(healthFactor) : undefined);
  const healthStatusText = typeof healthFactor === "bigint" ? healthFactorStatusText(healthFactor) : null;
  const isEmpty = suppliedStr === "0" && borrowedStr === "0";
  const isHealthCritical = healthStatusText === healthFactorStatusDanger && !isEmpty;
  const maxWithdrawStr = typeof maxWithdraw === "string" ? maxWithdraw : (formatToken ? formatToken(maxWithdraw, DEFAULT_DECIMALS) : maxWithdraw.toString());
  const maxBorrowStr = typeof maxBorrow === "string" ? maxBorrow : (formatToken ? formatToken(maxBorrow, DEFAULT_DECIMALS) : maxBorrow.toString());
  const displaySupplied = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(suppliedStr);
  const displayBorrowed = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(borrowedStr);
  const displayMaxWithdraw = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(maxWithdrawStr);
  const displayMaxBorrow = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(maxBorrowStr);
  const isInfiniteHealth = healthStatusText === healthFactorStatusInfinite;
  const displayHealthVal = isEmpty || isInfiniteHealth ? healthFactorStatusInfinite : formatWithThousandsSeparator(healthVal);
  const healthBarModifier =
    isEmpty ? "--empty" : healthStatusText === healthFactorStatusDanger ? "--danger" : healthStatusText === healthFactorStatusWarning ? "--warn" : "--safe";

  return (
    <div className="card">
      <div className="cardTitle">{userPositionTitle}</div>
      <div className="metricGrid metricGrid--market">
        <div className="metricItem">
          <span className="metricLabel">{positionSuppliedLabel}</span>
          <span className="metricValue">{displaySupplied}</span>
        </div>
        <div className="metricItem">
          <span className="metricLabel">{positionBorrowedLabel}</span>
          <span className="metricValue">{displayBorrowed}</span>
        </div>
        <div className={`metricItem healthFactorRowBar healthFactorRowBar${healthBarModifier} ${isHealthCritical ? "healthFactorRowDanger" : ""}`}>
          <span className="metricLabel" title={healthFactorTooltip}>{positionHealthFactorLabel}</span>
          <span className={`metricValue metricValue--emphasis ${isEmpty || isInfiniteHealth ? "healthFactorEmpty" : ""}`} style={!isEmpty && !isInfiniteHealth && color ? { color } : undefined}>
            {isEmpty || isInfiniteHealth ? healthFactorStatusInfinite : (
              <>
                {displayHealthVal}
                {healthStatusText != null && <span className="healthFactorStatus"> ({healthStatusText})</span>}
              </>
            )}
          </span>
        </div>
        <div className="metricItem">
          <span className="metricLabel" title={maxWithdrawTooltip}>{positionMaxWithdrawLabel}</span>
          <span className="metricValue">{displayMaxWithdraw}</span>
        </div>
        <div className="metricItem">
          <span className="metricLabel">{positionMaxBorrowLabel}</span>
          <span className="metricValue">{displayMaxBorrow}</span>
        </div>
      </div>
      <p className="muted healthFactorThresholdHint" aria-hidden="true">{healthFactorThresholdHint}</p>
      <div className="healthFactorThresholdLegend" aria-hidden="true">
        <span className="healthFactorLegendItem">
          <span className="healthFactorLegendDot healthFactorLegendDot--warn" />
          {healthFactorWarnThresholdLabel}
        </span>
        <span className="healthFactorLegendItem">
          <span className="healthFactorLegendDot healthFactorLegendDot--danger" />
          {healthFactorDangerThresholdLabel}
        </span>
      </div>
      {isHealthCritical && <p className="healthFactorCriticalHint" role="alert">{healthFactorCriticalHint}</p>}
      {isEmpty && (
        <div className="emptyStateBlock">
          <p className="muted positionEmptyHint">{positionEmptyHint}</p>
          <button type="button" className="btn btnSecondary btnSmall emptyStateCta" onClick={() => document.getElementById("action-card-supply")?.scrollIntoView({ behavior: "smooth" })}>
            {positionEmptyCtaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
