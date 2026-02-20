import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_DECIMALS, TOKEN_AMOUNT_DECIMALS_MAIN } from "../config/runtime";
import {
  marketsTitle,
  marketsSubtitle,
  marketsSectionAria,
  marketsSortByLabel,
  marketsSortByApy,
  marketsSortByUtilization,
  marketsSortByTotalSupply,
  marketsFilterByAssetLabel,
  marketSupplyApy,
  marketBorrowApy,
  marketSupplyCta,
  marketBorrowCta,
  marketsConnectToLoad,
  marketsEmptyDataHint,
  marketsDisconnectHint,
  poolTotalSupplyLabel,
  poolTotalBorrowLabel,
  poolUtilizationRateLabel,
  emptyPlaceholder,
  supplyRateTooltip,
  borrowRateTooltip,
  utilizationRateTooltip,
  usd8Label,
  dataSourceOracleLabel,
  marketsLiveRatesFromChain,
} from "../config/ui";
import { useWallet } from "../hooks/useWallet";
import { usePoolInfo } from "../hooks/usePoolInfo";
import { useReserveRiskParams } from "../hooks/useReserveRiskParams";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import { getContracts } from "../contracts/contracts";
import { getDeployments } from "../contracts/deployments";
import { formatWithThousandsSeparator, formatAmountForDisplay, formatAmountForDisplayWithStrategy } from "../utils/format";
import { PriceVolumeChart } from "../components/charts/PriceVolumeChart";
import { ReserveList, type ReserveItem } from "../components/markets/ReserveList";

function formatPercent(v: bigint): string {
  return `${v.toString()}%`;
}


export function MarketsPage() {
  const wallet = useWallet();
  const deployments = getDeployments(wallet.chainId);
  const contracts = useMemo(
    () => (wallet.provider && wallet.chainId != null ? getContracts(wallet.provider, wallet.chainId) : undefined),
    [wallet.provider, wallet.chainId]
  );
  const poolInfo = usePoolInfo(wallet.provider, wallet.chainId);
  const usd8Meta = useTokenMetadata(contracts?.usd8);
  const decimals = usd8Meta.decimals ?? DEFAULT_DECIMALS;
  const symbol = usd8Meta.symbol ?? usd8Label;

  const pool = poolInfo.pool;
  const loading = poolInfo.loading;
  const error = poolInfo.error;
  const noData = !wallet.account || !deployments ? marketsConnectToLoad : null;
  const reserveRiskParams = useReserveRiskParams(contracts?.lending, deployments?.usd8Address);
  const [sortBy, setSortBy] = useState<"apy" | "utilization" | "totalSupply">("apy");
  const [filterAsset, setFilterAsset] = useState<string>("");

  const totalSupplyStr = pool ? formatAmountForDisplay(pool.totalSupply, decimals, TOKEN_AMOUNT_DECIMALS_MAIN) : emptyPlaceholder;
  const totalBorrowStr = pool ? formatAmountForDisplay(pool.totalBorrow, decimals, TOKEN_AMOUNT_DECIMALS_MAIN) : emptyPlaceholder;
  const utilizationStr = pool ? formatPercent(pool.utilizationRate) : emptyPlaceholder;
  const supplyRateStr = pool ? formatPercent(pool.supplyRate) : emptyPlaceholder;
  const borrowRateStr = pool ? formatPercent(pool.borrowRate) : emptyPlaceholder;
  const isEmpty = pool ? pool.totalSupply === 0n && pool.totalBorrow === 0n : true;

  const reservesRaw: ReserveItem[] = useMemo(() => {
    const real: ReserveItem[] = pool
      ? [{
          symbol,
          name: "Stablecoin (supply & borrow)",
          supplyApy: supplyRateStr,
          borrowApy: borrowRateStr,
          totalSupply: totalSupplyStr,
          totalBorrow: totalBorrowStr,
          utilization: utilizationStr,
          // USD column: current single-asset (USD8) uses totalSupply as 1:1 USD proxy; mainnet should use oracle-derived USD.
          totalLiquidityUsd: formatAmountForDisplayWithStrategy(pool.totalSupply, decimals, { maxDecimals: TOKEN_AMOUNT_DECIMALS_MAIN, compactAbove: 999_999 }),
          ltvPct: reserveRiskParams?.ltvPct,
          ltPct: reserveRiskParams?.ltPct,
          sortSupplyApyNum: Number(pool.supplyRate),
          sortUtilizationNum: Number(pool.utilizationRate),
          sortTotalSupplyNum: Number(pool.totalSupply),
        }]
      : [];
    const mock: ReserveItem[] = [
      { symbol: "USDC", name: "USD Coin", supplyApy: "—", borrowApy: "—", totalSupply: "—", totalBorrow: "—", utilization: "—", isMock: true },
      { symbol: "ETH", name: "Ethereum", supplyApy: "—", borrowApy: "—", totalSupply: "—", totalBorrow: "—", utilization: "—", isMock: true },
      { symbol: "DAI", name: "Dai Stablecoin", supplyApy: "—", borrowApy: "—", totalSupply: "—", totalBorrow: "—", utilization: "—", isMock: true },
    ];
    return [...real, ...mock];
  }, [pool, symbol, decimals, supplyRateStr, borrowRateStr, totalSupplyStr, totalBorrowStr, utilizationStr, reserveRiskParams]);

  const reserves = useMemo(() => {
    const key = sortBy;
    let list = [...reservesRaw].sort((a, b) => {
      const va = key === "apy" ? (a.sortSupplyApyNum ?? -1) : key === "utilization" ? (a.sortUtilizationNum ?? -1) : (a.sortTotalSupplyNum ?? -1);
      const vb = key === "apy" ? (b.sortSupplyApyNum ?? -1) : key === "utilization" ? (b.sortUtilizationNum ?? -1) : (b.sortTotalSupplyNum ?? -1);
      return vb - va;
    });
    if (filterAsset) list = list.filter((r) => r.symbol === filterAsset);
    return list;
  }, [reservesRaw, sortBy, filterAsset]);

  return (
    <section className="marketsSection" aria-label={marketsSectionAria}>
      <h2 className="sectionTitle">{marketsTitle}</h2>
      <p className="muted marketsSubtitle pageIntro">{wallet.account ? marketsLiveRatesFromChain : marketsSubtitle}</p>

      {noData && !wallet.account && (
        <div className="card marketsConnectCard">
          <p className="muted" style={{ margin: 0 }}>{marketsEmptyDataHint}</p>
          <p className="muted" style={{ marginTop: "0.25rem", fontSize: "0.875rem" }}>{marketsDisconnectHint}</p>
        </div>
      )}

      {(wallet.account && deployments) && (
        <>
          {loading && <p className="pageStateLoading" role="status" aria-live="polite">Loading market data…</p>}
          {error && (
            <div className="pageStateError" role="alert">
              <p className="errorText" style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div role="region" aria-label="Market overview">
              <div className="marketsToolbar">
                <label className="marketsSortLabel">
                  <span className="marketsSortLabelText">{marketsSortByLabel}</span>
                  <select
                    className="marketsSortSelect"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "apy" | "utilization" | "totalSupply")}
                    aria-label={marketsSortByLabel}
                  >
                    <option value="apy">{marketsSortByApy}</option>
                    <option value="utilization">{marketsSortByUtilization}</option>
                    <option value="totalSupply">{marketsSortByTotalSupply}</option>
                  </select>
                </label>
                <label className="marketsSortLabel">
                  <span className="marketsSortLabelText">{marketsFilterByAssetLabel}</span>
                  <select
                    className="marketsSortSelect"
                    value={filterAsset}
                    onChange={(e) => setFilterAsset(e.target.value)}
                    aria-label={marketsFilterByAssetLabel}
                  >
                    <option value="">All</option>
                    <option value={symbol}>{symbol}</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="DAI">DAI</option>
                  </select>
                </label>
              </div>
              <ReserveList reserves={reserves} />
              {pool && (
              <div className="marketsGrid">
              <div className="card marketCard">
                <div className="marketCardHeader">
                  <span className="marketAssetSymbol">{symbol}</span>
                  <span className="marketAssetName">Stablecoin (supply & borrow)</span>
                </div>
                <div className="marketCardHero">
                  <div className="marketCardMetric" title={supplyRateTooltip}>
                    <span className="marketCardLabel">{marketSupplyApy}</span>
                    <span className="marketCardValue marketCardValue--primary">{formatWithThousandsSeparator(supplyRateStr)}</span>
                  </div>
                  <div className="marketCardMetric" title={borrowRateTooltip}>
                    <span className="marketCardLabel">{marketBorrowApy}</span>
                    <span className="marketCardValue">{formatWithThousandsSeparator(borrowRateStr)}</span>
                  </div>
                </div>
                {(reserveRiskParams?.ltvPct != null || reserveRiskParams?.ltPct != null) && (
                  <p className="marketCardRiskLine muted" role="note">
                    LTV {reserveRiskParams?.ltvPct ?? "—"}% · LT {reserveRiskParams?.ltPct ?? "—"}%
                  </p>
                )}
                <div className="marketCardMetrics">
                  <div className="marketCardMetric" title={utilizationRateTooltip}>
                    <span className="marketCardLabel">{poolUtilizationRateLabel}</span>
                    <span className="marketCardValue">{formatWithThousandsSeparator(utilizationStr)}</span>
                  </div>
                  <div className="marketCardMetric">
                    <span className="marketCardLabel">{poolTotalSupplyLabel}</span>
                    <span className="marketCardValue">{formatWithThousandsSeparator(totalSupplyStr)}</span>
                  </div>
                  <div className="marketCardMetric">
                    <span className="marketCardLabel">{poolTotalBorrowLabel}</span>
                    <span className="marketCardValue">{formatWithThousandsSeparator(totalBorrowStr)}</span>
                  </div>
                </div>
                <div className="marketCardActions">
                  <Link to="/?action=supply&asset=USD8" className="btn btnPrimary marketCtaBtn">{marketSupplyCta}</Link>
                  <Link to="/?action=borrow&asset=USD8" className="btn btnSecondary marketCtaBtn">{marketBorrowCta}</Link>
                </div>
                {isEmpty && (
                  <p className="muted marketCardHint">Supply assets to start earning. Use Dashboard to supply or borrow.</p>
                )}
              </div>

              <div className="marketChartSlot">
                <PriceVolumeChart />
              </div>
              <p className="dataProvenanceHint muted" role="note" aria-label={dataSourceOracleLabel}>
                {dataSourceOracleLabel}
              </p>
              </div>
              )}
            </div>
          )}
        </>
      )}

      {wallet.account && !deployments && (
        <div className="card" role="alert">
          <p className="muted" style={{ margin: 0 }}>Unsupported network. Switch to a supported chain to see markets.</p>
        </div>
      )}
    </section>
  );
}
