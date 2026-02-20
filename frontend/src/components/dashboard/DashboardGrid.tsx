import { formatUnits } from "ethers";
import { WETH_DECIMALS } from "../../config/network";
import { DISPLAY_MAX_DECIMALS, TOKEN_AMOUNT_DECIMALS_MAIN } from "../../config/runtime";
import { emptyPlaceholder, balancesTitle, connectWalletToLoadBalances, connectWalletToLoadBalancesDisconnectHint, balancesLoadFailedHint, poolTitle, userPositionTitle, usd8Label, wethLabel, skeletonLoadingAriaLabel } from "../../config/ui";
import { Skeleton } from "../ui/Skeleton";
import { PoolOverview } from "./PoolOverview";
import { UserPosition } from "./UserPosition";
import { healthFactorColor, formatWithThousandsSeparator, clampDecimalsForDisplay, formatAmountForDisplay } from "../../utils/format";
import type { PoolInfo, UserPosition as UserPositionData } from "../../hooks/useDashboard";

export function DashboardGrid(props: {
  hasAccount: boolean;
  loading: boolean;
  data: { usd8Balance?: bigint; wethBalance?: bigint; pool?: PoolInfo; position?: UserPositionData } | undefined;
  usd8Decimals: number;
  formatToken: (v: bigint | undefined, d: number) => string;
  formatPercent: (v: bigint | undefined) => string;
  /** Pool asset symbol for unit hint on Pool totals (e.g. USD8). */
  symbol?: string;
}) {
  const { hasAccount, loading, data, usd8Decimals, formatToken, formatPercent, symbol } = props;
  // When wallet is not connected, do not show Pool/User Position (avoid showing stale data from a previous session).
  const pool = hasAccount ? data?.pool : undefined;
  const position = hasAccount ? data?.position : undefined;
  // Only show balance numbers when connected; when disconnected always show placeholder so we never leak previous account balances.
  const usd8Raw =
    hasAccount && data?.usd8Balance !== undefined
      ? clampDecimalsForDisplay(formatUnits(data.usd8Balance, usd8Decimals), DISPLAY_MAX_DECIMALS)
      : emptyPlaceholder;
  const wethRaw =
    hasAccount && data?.wethBalance !== undefined
      ? clampDecimalsForDisplay(formatUnits(data.wethBalance, WETH_DECIMALS), DISPLAY_MAX_DECIMALS)
      : emptyPlaceholder;

  return (
    <div className="dashboardGridTop">
      <div className="card dashboardGridBalance">
        <div className="cardTitle">{balancesTitle}</div>
        {!hasAccount ? (
          <div>
            <div className="muted">{connectWalletToLoadBalances}</div>
            <p className="muted" style={{ marginTop: "0.25rem", fontSize: "0.875rem" }}>{connectWalletToLoadBalancesDisconnectHint}</p>
          </div>
        ) : loading && !data ? (
          <div className="metricGrid" aria-busy="true" aria-label={skeletonLoadingAriaLabel}>
            <div className="metricItem">
              <span className="metricLabel"><Skeleton width="4rem" height="1rem" aria-label={skeletonLoadingAriaLabel} /></span>
              <span className="metricValue"><Skeleton width="5rem" height="1.25rem" /></span>
            </div>
            <div className="metricItem">
              <span className="metricLabel"><Skeleton width="4rem" height="1rem" /></span>
              <span className="metricValue"><Skeleton width="5rem" height="1.25rem" /></span>
            </div>
          </div>
        ) : (
          <>
            <div className="metricGrid">
              <div className="metricItem">
                <span className="metricLabel" translate="no">{usd8Label}</span>
                <span className="metricValue">
                  {usd8Raw === emptyPlaceholder ? usd8Raw : <>{formatWithThousandsSeparator(usd8Raw)} <span translate="no">{usd8Label}</span></>}
                </span>
              </div>
              <div className="metricItem">
                <span className="metricLabel" translate="no">{wethLabel}</span>
                <span className="metricValue">
                  {wethRaw === emptyPlaceholder ? wethRaw : <>{formatWithThousandsSeparator(wethRaw)} <span translate="no">{wethLabel}</span></>}
                </span>
              </div>
            </div>
            {!data && (
              <p className="muted balancesLoadFailedHint" role="status">
                {balancesLoadFailedHint}
              </p>
            )}
          </>
        )}
      </div>
      {loading && !pool ? (
        <div className="card dashboardGridSkeleton" aria-busy="true" aria-label={poolTitle}>
          <div className="cardTitle">{poolTitle}</div>
          <div className="metricGrid metricGrid--market">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="metricItem">
                <span className="metricLabel"><Skeleton width="5rem" height="1rem" aria-label={skeletonLoadingAriaLabel} /></span>
                <span className="metricValue"><Skeleton width="4rem" height="1.25rem" /></span>
              </div>
            ))}
          </div>
        </div>
      ) : pool ? (
        <PoolOverview totalSupply={formatAmountForDisplay(pool.totalSupply, usd8Decimals, TOKEN_AMOUNT_DECIMALS_MAIN)} totalBorrow={formatAmountForDisplay(pool.totalBorrow, usd8Decimals, TOKEN_AMOUNT_DECIMALS_MAIN)} utilization={pool.utilizationRate} supplyRate={pool.supplyRate} borrowRate={pool.borrowRate} formatToken={formatToken} formatPercent={formatPercent} symbol={symbol} />
      ) : !hasAccount ? (
        <div className="card dashboardGridSkeleton" aria-label={poolTitle}>
          <div className="cardTitle">{poolTitle}</div>
          <div className="muted">{connectWalletToLoadBalances}</div>
        </div>
      ) : null}
      {loading && !position ? (
        <div className="card dashboardGridSkeleton" aria-busy="true" aria-label={userPositionTitle}>
          <div className="cardTitle">{userPositionTitle}</div>
          <div className="metricGrid metricGrid--market">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="metricItem">
                <span className="metricLabel"><Skeleton width="5rem" height="1rem" aria-label={skeletonLoadingAriaLabel} /></span>
                <span className="metricValue"><Skeleton width="4rem" height="1.25rem" /></span>
              </div>
            ))}
          </div>
        </div>
      ) : position ? (
        <UserPosition supplied={position.supplied} borrowed={position.borrowed} healthFactor={position.healthFactor} maxWithdraw={position.maxWithdraw} maxBorrow={position.maxBorrow} healthColor={healthFactorColor(position.healthFactor)} tokenDecimals={usd8Decimals} formatToken={formatToken} formatPercent={formatPercent} />
      ) : !hasAccount ? (
        <div className="card dashboardGridSkeleton" aria-label={userPositionTitle}>
          <div className="cardTitle">{userPositionTitle}</div>
          <div className="muted">{connectWalletToLoadBalances}</div>
        </div>
      ) : null}
    </div>
  );
}
