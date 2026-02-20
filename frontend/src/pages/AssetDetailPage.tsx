import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_DECIMALS } from "../config/runtime";
import {
  marketSupplyApy,
  marketBorrowApy,
  poolTotalSupplyLabel,
  poolTotalBorrowLabel,
  poolUtilizationRateLabel,
  riskLtvLabel,
  riskLiquidationThresholdLabel,
  riskParamsDefaultSuffix,
  marketSupplyCta,
  marketBorrowCta,
  usd8Label,
  assetDetailSingleAssetNote,
} from "../config/ui";
import { useWallet } from "../hooks/useWallet";
import { usePoolInfo } from "../hooks/usePoolInfo";
import { useReserveRiskParams } from "../hooks/useReserveRiskParams";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import { getContracts } from "../contracts/contracts";
import { getDeployments } from "../contracts/deployments";
import { formatWithThousandsSeparator, formatAmountForDisplay } from "../utils/format";
import { PriceVolumeChart } from "../components/charts/PriceVolumeChart";

function formatPercent(v: bigint): string {
  return `${v.toString()}%`;
}

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const wallet = useWallet();
  const deployments = getDeployments(wallet.chainId);
  const contracts = useMemo(
    () => (wallet.provider && wallet.chainId != null ? getContracts(wallet.provider, wallet.chainId) : undefined),
    [wallet.provider, wallet.chainId]
  );
  const poolInfo = usePoolInfo(wallet.provider, wallet.chainId);
  const reserveRiskParams = useReserveRiskParams(contracts?.lending, deployments?.usd8Address);
  const usd8Meta = useTokenMetadata(contracts?.usd8);
  const decimals = usd8Meta.decimals ?? DEFAULT_DECIMALS;
  const symbol = usd8Meta.symbol ?? usd8Label;
  const pool = poolInfo.pool;

  const displaySymbol = assetId ?? symbol;
  const ltvPct = reserveRiskParams?.ltvPct ?? 75;
  const ltPct = reserveRiskParams?.ltPct ?? 80;
  const riskIsDefault = reserveRiskParams == null;

  return (
    <section className="marketsSection assetDetailSection">
      <p><Link to="/markets" className="navLink">← Markets</Link></p>
      <h2 className="sectionTitle" data-testid="asset-detail-title">{displaySymbol}</h2>
      {assetId && <p className="muted assetDetailSingleAssetNote">{assetDetailSingleAssetNote}</p>}
      {!wallet.account || !deployments ? (
        <p className="muted">Connect wallet to see asset data.</p>
      ) : poolInfo.loading ? (
        <p className="muted">Loading…</p>
      ) : pool ? (
        <>
          <div className="card assetDetailCard">
            <div className="marketCardHero">
              <div className="marketCardMetric">
                <span className="marketCardLabel">{marketSupplyApy}</span>
                <span className="marketCardValue marketCardValue--primary">{formatWithThousandsSeparator(formatPercent(pool.supplyRate))}</span>
              </div>
              <div className="marketCardMetric">
                <span className="marketCardLabel">{marketBorrowApy}</span>
                <span className="marketCardValue">{formatWithThousandsSeparator(formatPercent(pool.borrowRate))}</span>
              </div>
              <div className="marketCardMetric">
                <span className="marketCardLabel">{poolTotalSupplyLabel}</span>
                <span className="marketCardValue">{formatAmountForDisplay(pool.totalSupply, decimals)}</span>
              </div>
              <div className="marketCardMetric">
                <span className="marketCardLabel">{poolTotalBorrowLabel}</span>
                <span className="marketCardValue">{formatAmountForDisplay(pool.totalBorrow, decimals)}</span>
              </div>
              <div className="marketCardMetric">
                <span className="marketCardLabel">{poolUtilizationRateLabel}</span>
                <span className="marketCardValue">{formatWithThousandsSeparator(formatPercent(pool.utilizationRate))}</span>
              </div>
            </div>
            <div className="riskParametersGrid" style={{ marginTop: "var(--spacing-md)" }}>
              <div className="riskParamItem"><span className="riskParamLabel">{riskLtvLabel}</span><span className="riskParamValue">{ltvPct}%{riskIsDefault ? riskParamsDefaultSuffix : ""}</span></div>
              <div className="riskParamItem"><span className="riskParamLabel">{riskLiquidationThresholdLabel}</span><span className="riskParamValue">{ltPct}%{riskIsDefault ? riskParamsDefaultSuffix : ""}</span></div>
            </div>
            <div className="marketCardActions" style={{ marginTop: "var(--spacing-lg)" }}>
              <Link to={`/?action=supply&asset=${encodeURIComponent(displaySymbol)}`} className="btn btnPrimary marketCtaBtn">{marketSupplyCta}</Link>
              <Link to={`/?action=borrow&asset=${encodeURIComponent(displaySymbol)}`} className="btn btnSecondary marketCtaBtn">{marketBorrowCta}</Link>
            </div>
          </div>
          <div className="marketChartSlot" style={{ marginTop: "var(--spacing-xl)" }}>
            <PriceVolumeChart />
          </div>
        </>
      ) : (
        <p className="muted">No pool data for this asset.</p>
      )}
    </section>
  );
}
