import {
  riskParametersTitle,
  riskLtvLabel,
  riskLtvTooltip,
  riskLiquidationThresholdLabel,
  riskLiquidationThresholdTooltip,
  healthFactorThresholdHint,
  riskParamsDefaultSuffix,
} from "../../config/ui";

const DEFAULT_LTV_PCT = 75;
const DEFAULT_LT_PCT = 80;

export type RiskParametersPanelProps = {
  /** When set, show chain LTV/LT; otherwise show default with "(default)" label (P2 audit). */
  reserveParams?: { ltvPct: number; ltPct: number } | undefined;
};

export function RiskParametersPanel({ reserveParams }: RiskParametersPanelProps = {}) {
  const ltvPct = reserveParams?.ltvPct ?? DEFAULT_LTV_PCT;
  const ltPct = reserveParams?.ltPct ?? DEFAULT_LT_PCT;
  const isDefault = reserveParams == null;

  return (
    <details className="riskParametersDetails" open={false} data-testid="risk-parameters-panel">
      <summary className="riskParametersSummary">{riskParametersTitle}</summary>
      <div className="card riskParametersCard">
        <div className="riskParametersGrid">
          <div className="riskParamItem">
            <span className="riskParamLabel" title={riskLtvTooltip}>{riskLtvLabel}</span>
            <span className="riskParamValue">{ltvPct}%{isDefault ? riskParamsDefaultSuffix : ""}</span>
          </div>
          <div className="riskParamItem">
            <span className="riskParamLabel" title={riskLiquidationThresholdTooltip}>{riskLiquidationThresholdLabel}</span>
            <span className="riskParamValue">{ltPct}%{isDefault ? riskParamsDefaultSuffix : ""}</span>
          </div>
          <div className="riskParamItem">
            <span className="riskParamLabel" title={healthFactorThresholdHint}>Health factor</span>
            <span className="riskParamValue riskParamValue--hint">{healthFactorThresholdHint}</span>
          </div>
        </div>
      </div>
    </details>
  );
}
