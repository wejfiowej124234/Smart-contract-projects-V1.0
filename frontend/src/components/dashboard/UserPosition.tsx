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
import { healthFactorColor, healthFactorStatusText, formatHealthFactorForDisplay, formatWithThousandsSeparator, formatHeadroomDisplay } from "../../utils/format";
import type { UserPositionProps } from "../../types/dashboard";

export function UserPosition({
  supplied,
  borrowed,
  healthFactor,
  maxWithdraw,
  maxBorrow,
  healthColor,
  tokenDecimals,
  formatToken,
}: UserPositionProps) {
  const decimals = tokenDecimals ?? DEFAULT_DECIMALS;
  const suppliedStr = typeof supplied === "string" ? supplied : (formatToken ? formatToken(supplied, decimals) : supplied.toString());
  const borrowedStr = typeof borrowed === "string" ? borrowed : (formatToken ? formatToken(borrowed, decimals) : borrowed.toString());
  const color = healthColor ?? (typeof healthFactor === "bigint" ? healthFactorColor(healthFactor) : undefined);
  const healthStatusText = typeof healthFactor === "bigint" ? healthFactorStatusText(healthFactor) : null;
  const isEmpty = suppliedStr === "0" && borrowedStr === "0";
  const isHealthCritical = healthStatusText === healthFactorStatusDanger && !isEmpty;
  const maxWithdrawHeadroom =
    typeof maxWithdraw === "string"
      ? { display: maxWithdraw, tooltip: undefined as string | undefined }
      : formatToken
        ? formatHeadroomDisplay(maxWithdraw, decimals, (v, d) => formatToken(v, d))
        : { display: maxWithdraw.toString(), tooltip: undefined };
  const maxBorrowHeadroom =
    typeof maxBorrow === "string"
      ? { display: maxBorrow, tooltip: undefined as string | undefined }
      : formatToken
        ? formatHeadroomDisplay(maxBorrow, decimals, (v, d) => formatToken(v, d))
        : { display: maxBorrow.toString(), tooltip: undefined };
  const displaySupplied = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(suppliedStr);
  const displayBorrowed = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(borrowedStr);
  const displayMaxWithdraw = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(maxWithdrawHeadroom.display);
  const displayMaxBorrow = isEmpty ? emptyPlaceholder : formatWithThousandsSeparator(maxBorrowHeadroom.display);
  const isInfiniteHealth = healthStatusText === healthFactorStatusInfinite;
  const displayHealthVal =
    isEmpty || isInfiniteHealth
      ? healthFactorStatusInfinite
      : typeof healthFactor === "bigint"
        ? formatHealthFactorForDisplay(healthFactor)
        : formatWithThousandsSeparator(String(healthFactor));
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
          <span className="metricValue" title={maxWithdrawHeadroom.tooltip ?? maxWithdrawTooltip}>{displayMaxWithdraw}</span>
        </div>
        <div className="metricItem">
          <span className="metricLabel">{positionMaxBorrowLabel}</span>
          <span className="metricValue" title={maxBorrowHeadroom.tooltip}>{displayMaxBorrow}</span>
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
