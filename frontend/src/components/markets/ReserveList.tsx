import { useState } from "react";
import { Link } from "react-router-dom";
import {
  marketSupplyApy,
  marketBorrowApy,
  marketSupplyCta,
  marketBorrowCta,
  poolTotalSupplyLabel,
  poolTotalBorrowLabel,
  poolTotalsUnitTooltipSuffix,
  poolUtilizationRateLabel,
  supplyRateTooltip,
  borrowRateTooltip,
  utilizationRateTooltip,
  utilizationTooltipHigh,
  utilizationTooltipMedium,
  utilizationTooltipLow,
  riskLtvShortLabel,
  riskLtShortLabel,
  marketTotalLiquidityUsd,
  emptyPlaceholder,
  marketsMockAssetComingSoon,
  marketsMockAssetNotAvailable,
  marketsEnabledSectionTitle,
  marketsComingSoonSectionTitle,
  marketsComingSoonWhatMeans,
  marketsMockExplanationModalTitle,
  marketsMockExplanationModalBody,
  marketsDisabledReasonComingSoon,
  marketsSupplyBtnTooltip,
  marketsBorrowBtnTooltip,
  closeLabel,
} from "../../config/ui";
import { formatWithThousandsSeparator } from "../../utils/format";

export type ReserveItem = {
  symbol: string;
  name?: string;
  supplyApy: string;
  borrowApy: string;
  totalSupply: string;
  totalBorrow: string;
  utilization: string;
  /** Total liquidity in USD (optional, mainnet-style). */
  totalLiquidityUsd?: string;
  ltvPct?: number;
  ltPct?: number;
  /** When true: show "Coming soon", disable Supply/Borrow (no misleading mock trading). */
  isMock?: boolean;
  /** For sorting: numeric supply APY. */
  sortSupplyApyNum?: number;
  sortUtilizationNum?: number;
  sortTotalSupplyNum?: number;
};

function ReserveTable({ reserves, showLtv }: { reserves: ReserveItem[]; showLtv: boolean }) {
  return (
    <table className="reserveListTable" aria-label="Reserves">
      <thead>
        <tr>
          <th>Asset</th>
          <th title={supplyRateTooltip}>{marketSupplyApy}</th>
          <th title={borrowRateTooltip}>{marketBorrowApy}</th>
          <th title={utilizationRateTooltip}>{poolUtilizationRateLabel}</th>
          <th>{marketTotalLiquidityUsd}</th>
          <th>{poolTotalSupplyLabel}</th>
          <th>{poolTotalBorrowLabel}</th>
          {showLtv && (
            <>
              <th title={riskLtvShortLabel}>{riskLtvShortLabel}</th>
              <th title={riskLtShortLabel}>{riskLtShortLabel}</th>
            </>
          )}
          <th aria-hidden>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reserves.map((r, i) => (
          <tr key={r.symbol + i}>
            <td data-label="Asset">
              <span className="reserveSymbol">{r.symbol}</span>
              {r.isMock && <span className="reserveMockBadge" title={marketsMockAssetNotAvailable}>{marketsMockAssetComingSoon}</span>}
              {r.name && <span className="reserveName">{r.name}</span>}
            </td>
            <td data-label={marketSupplyApy} className="reserveApy reserveApy--supply">{formatWithThousandsSeparator(r.supplyApy)}</td>
            <td data-label={marketBorrowApy} className="reserveApy">{formatWithThousandsSeparator(r.borrowApy)}</td>
            <td
              data-label={poolUtilizationRateLabel}
              className={`reserveUtilization reserveUtilization--${(r.sortUtilizationNum ?? 0) >= 80 ? "high" : (r.sortUtilizationNum ?? 0) >= 50 ? "medium" : "low"}`}
              title={(r.sortUtilizationNum ?? 0) >= 80 ? utilizationTooltipHigh : (r.sortUtilizationNum ?? 0) >= 50 ? utilizationTooltipMedium : utilizationTooltipLow}
              aria-label={(r.sortUtilizationNum ?? 0) >= 80 ? "Utilization high" : (r.sortUtilizationNum ?? 0) >= 50 ? "Utilization medium" : "Utilization low"}
            >
              {formatWithThousandsSeparator(r.utilization)}
            </td>
            <td data-label={marketTotalLiquidityUsd}>
              {r.totalLiquidityUsd != null && r.totalLiquidityUsd !== "" ? r.totalLiquidityUsd : <span className="muted">{emptyPlaceholder}</span>}
            </td>
            <td data-label={poolTotalSupplyLabel} title={`${poolTotalSupplyLabel} (${r.symbol}). ${poolTotalsUnitTooltipSuffix}`}>{formatWithThousandsSeparator(r.totalSupply)}</td>
            <td data-label={poolTotalBorrowLabel} title={`${poolTotalBorrowLabel} (${r.symbol}). ${poolTotalsUnitTooltipSuffix}`}>{formatWithThousandsSeparator(r.totalBorrow)}</td>
            {showLtv && (
              <>
                <td data-label={riskLtvShortLabel}>{r.ltvPct != null ? `${r.ltvPct}%` : emptyPlaceholder}</td>
                <td data-label={riskLtShortLabel}>{r.ltPct != null ? `${r.ltPct}%` : emptyPlaceholder}</td>
              </>
            )}
            <td data-label="Actions" title={r.isMock ? marketsDisabledReasonComingSoon : undefined}>
              {r.isMock ? (
                <span className="reserveListMockActions" role="status" title={marketsDisabledReasonComingSoon}>
                  <span className="reserveListMockBadge">{marketsMockAssetComingSoon}</span>
                  <span className="reserveListMockHint">{marketsMockAssetNotAvailable}</span>
                </span>
              ) : (
                <>
                  <Link to={r.symbol ? `/?action=supply&asset=${encodeURIComponent(r.symbol)}` : "/?action=supply"} className="btn btnPrimary btnSmall" title={marketsSupplyBtnTooltip}>{marketSupplyCta}</Link>
                  <Link to={r.symbol ? `/?action=borrow&asset=${encodeURIComponent(r.symbol)}` : "/?action=borrow"} className="btn btnSecondary btnSmall" title={marketsBorrowBtnTooltip}>{marketBorrowCta}</Link>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReserveList({ reserves }: { reserves: ReserveItem[] }) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  if (reserves.length === 0) return null;
  const showLtv = reserves.some((r) => r.ltvPct != null || r.ltPct != null);
  const enabled = reserves.filter((r) => !r.isMock);
  const comingSoon = reserves.filter((r) => r.isMock);
  return (
    <div className="reserveListWrap" data-testid="reserve-list">
      {enabled.length > 0 && (
        <div className="reserveListSection">
          <h3 className="reserveListSectionTitle">{marketsEnabledSectionTitle}</h3>
          <ReserveTable reserves={enabled} showLtv={showLtv} />
        </div>
      )}
      {comingSoon.length > 0 && (
        <div className="reserveListSection">
          <div className="reserveListSectionHeader">
            <h3 className="reserveListSectionTitle">{marketsComingSoonSectionTitle}</h3>
            <span className="reserveListSectionTitleHint"> — </span>
            <button type="button" className="btn btnText btnSmall reserveListExplanationBtn" onClick={() => setExplanationOpen(true)} aria-describedby="reserve-list-coming-soon-desc">
              {marketsComingSoonWhatMeans}
            </button>
          </div>
          <p id="reserve-list-coming-soon-desc" className="visuallyHidden">These assets are listed for discovery; supply and borrow are not yet available.</p>
          <ReserveTable reserves={comingSoon} showLtv={showLtv} />
        </div>
      )}
      {explanationOpen && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="mock-explanation-title" onClick={() => setExplanationOpen(false)}>
          <div className="modal modal--narrow" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 id="mock-explanation-title" className="modalTitle">{marketsMockExplanationModalTitle}</h2>
              <button type="button" className="btn btnSecondary btnSmall" onClick={() => setExplanationOpen(false)}>{closeLabel}</button>
            </div>
            <div className="modalBody">
              <p className="modalBodyText">{marketsMockExplanationModalBody}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
