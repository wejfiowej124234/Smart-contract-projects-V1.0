import { refresh, refreshing, emptyPlaceholder, metaMaskNotDetected, metaMaskBannerBody, getMetaMask, metaMaskInstallUrl, updatedLabel, blockLabel, actionsDisabled, autoRefreshLabel, autoRefreshOn, autoRefreshOff } from "../../config/ui";

export function DataStatusBar(props: {
  onRefresh: () => void;
  loading: boolean;
  hasAccount: boolean;
  isCorrectNetwork: boolean;
  lastUpdatedText: string;
  blockNumber: number | undefined;
  isMetaMaskAvailable: boolean;
  autoRefresh?: boolean;
  onAutoRefreshChange?: (on: boolean) => void;
}) {
  const { onRefresh, loading, hasAccount, isCorrectNetwork, lastUpdatedText, blockNumber, isMetaMaskAvailable, autoRefresh = true, onAutoRefreshChange } = props;
  return (
    <div className={`statusBar statusBarCompact${loading ? " statusBar--refreshing" : ""}`}>
      <button type="button" className="btn btnSecondary btnSmall" onClick={() => void onRefresh()} disabled={!hasAccount || loading} aria-label={loading ? refreshing : refresh}>
        {loading ? refreshing : refresh}
      </button>
      {onAutoRefreshChange && (
        <label className="statusBarAutoRefresh">
          <span className="pill muted">{autoRefreshLabel}</span>
          <button type="button" className="btn btnSecondary btnSmall" onClick={() => onAutoRefreshChange(!autoRefresh)} aria-pressed={autoRefresh} aria-label={autoRefresh ? autoRefreshOff : autoRefreshOn}>
            {autoRefresh ? autoRefreshOn : autoRefreshOff}
          </button>
        </label>
      )}
      <span className="pill muted">{updatedLabel}: {lastUpdatedText}</span>
      <span className="pill muted">{blockLabel}: {blockNumber ?? emptyPlaceholder}</span>
      {hasAccount && !isCorrectNetwork && <span className="pill pillWarn">{actionsDisabled}</span>}
      {!isMetaMaskAvailable && (
        <div className="banner bannerErr dataStatusBanner" role="alert" aria-live="polite">
          <div className="bannerTitle">{metaMaskNotDetected}</div>
          <div className="dataStatusBannerBody">{metaMaskBannerBody}</div>
          <div className="dataStatusBannerLink"><a href={metaMaskInstallUrl} target="_blank" rel="noreferrer">{getMetaMask}</a></div>
        </div>
      )}
    </div>
  );
}
