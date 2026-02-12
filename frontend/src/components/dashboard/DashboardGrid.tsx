import { formatUnits } from "ethers";
import { WETH_DECIMALS } from "../../config/network";
import { DISPLAY_MAX_DECIMALS } from "../../config/runtime";
import { emptyPlaceholder, balancesTitle, connectWalletToLoadBalances, balancesLoadFailedHint, loading as loadingText, poolTitle, userPositionTitle, usd8Label, wethLabel } from "../../config/ui";
import { PoolOverview } from "./PoolOverview";
import { UserPosition } from "./UserPosition";
import { healthFactorColor, formatWithThousandsSeparator, clampDecimalsForDisplay } from "../../utils/format";
import type { PoolInfo, UserPosition as UserPositionData } from "../../hooks/useDashboard";

export function DashboardGrid(props: {
  hasAccount: boolean;
  loading: boolean;
  data: { usd8Balance?: bigint; wethBalance?: bigint; pool?: PoolInfo; position?: UserPositionData } | undefined;
  usd8Decimals: number;
  formatToken: (v: bigint | undefined, d: number) => string;
  formatPercent: (v: bigint | undefined) => string;
}) {
  const { hasAccount, loading, data, usd8Decimals, formatToken, formatPercent } = props;
  const pool = data?.pool;
  const position = data?.position;
  const usd8Raw = data?.usd8Balance !== undefined ? clampDecimalsForDisplay(formatUnits(data.usd8Balance, usd8Decimals), DISPLAY_MAX_DECIMALS) : emptyPlaceholder;
  const wethRaw = data?.wethBalance !== undefined ? clampDecimalsForDisplay(formatUnits(data.wethBalance, WETH_DECIMALS), DISPLAY_MAX_DECIMALS) : emptyPlaceholder;
  const usd8Str = usd8Raw === emptyPlaceholder ? usd8Raw : formatWithThousandsSeparator(usd8Raw) + " " + usd8Label;
  const wethStr = wethRaw === emptyPlaceholder ? wethRaw : formatWithThousandsSeparator(wethRaw) + " " + wethLabel;

  return (
    <div className="dashboardGridTop">
      <div className="card dashboardGridBalance">
        <div className="cardTitle">{balancesTitle}</div>
        {!hasAccount ? (
          <div className="muted">{connectWalletToLoadBalances}</div>
        ) : loading && !data ? (
          <div className="muted">{loadingText}</div>
        ) : (
          <>
            <div className="metricGrid">
              <div className="metricItem">
                <span className="metricLabel">{usd8Label}</span>
                <span className="metricValue">{usd8Str}</span>
              </div>
              <div className="metricItem">
                <span className="metricLabel">{wethLabel}</span>
                <span className="metricValue">{wethStr}</span>
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
          <div className="muted">{loadingText}</div>
        </div>
      ) : pool ? (
        <PoolOverview totalSupply={pool.totalSupply} totalBorrow={pool.totalBorrow} utilization={pool.utilizationRate} supplyRate={pool.supplyRate} borrowRate={pool.borrowRate} formatToken={formatToken} formatPercent={formatPercent} />
      ) : null}
      {loading && !position ? (
        <div className="card dashboardGridSkeleton" aria-busy="true" aria-label={userPositionTitle}>
          <div className="cardTitle">{userPositionTitle}</div>
          <div className="muted">{loadingText}</div>
        </div>
      ) : position ? (
        <UserPosition supplied={position.supplied} borrowed={position.borrowed} healthFactor={position.healthFactor} maxWithdraw={position.maxWithdraw} maxBorrow={position.maxBorrow} healthColor={healthFactorColor(position.healthFactor)} formatToken={formatToken} formatPercent={formatPercent} />
      ) : null}
    </div>
  );
}
