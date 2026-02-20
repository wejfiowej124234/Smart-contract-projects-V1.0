import { useState } from "react";
import { refresh, refreshing, emptyPlaceholder, metaMaskNotDetected, metaMaskBannerBody, getMetaMask, metaMaskInstallUrl, updatedLabel, blockLabel, actionsDisabled, autoRefreshLabel, autoRefreshOn, autoRefreshOff, networkStatusLabel, networkStatusSynced, blockFreshnessBehindLabel, runtimeRiskMediumBanner, runtimeRiskHighBanner, rpcFallbackBannerTitle, rpcFallbackBannerBody, statusBarModeOk, statusBarModeDegraded, statusBarModeWritesDisabled, statusBarDetailsSummary, statusBarDegradedTooltip, statusBarHealthEnumOk, statusBarHealthEnumDegraded, statusBarHealthEnumWritesDisabled, statusBarOkPositionRiskHint, statusBarOkExplanation } from "../../config/ui";
import { BLOCK_STALE_THRESHOLD } from "../../config/runtime";
import type { RuntimeRisk } from "../../hooks/useRuntimeRisk";

export function DataStatusBar(props: {
  onRefresh: () => void;
  loading: boolean;
  hasAccount: boolean;
  isCorrectNetwork: boolean;
  lastUpdatedText: string;
  blockNumber: number | undefined;
  /** When data block is this many blocks behind chain head, show freshness hint. */
  blocksBehind?: number;
  isMetaMaskAvailable: boolean;
  autoRefresh?: boolean;
  onAutoRefreshChange?: (on: boolean) => void;
  /** Protocol-grade: show degraded / writes-disabled when tier is medium/high. */
  runtimeRisk?: RuntimeRisk;
  /** When tier is fallback, show RPC fallback hint. */
  rpcStatus?: { tier: "primary" | "fallback"; fallbackReason?: string; rpcUrlInUse?: string };
  /** When status is OK and position risk exists: e.g. "Position risk: At risk (HF 1.06)". Overrides generic hint. */
  positionRiskSummary?: string;
}) {
  const { onRefresh, loading, hasAccount, isCorrectNetwork, lastUpdatedText, blockNumber, blocksBehind, isMetaMaskAvailable, autoRefresh = true, onAutoRefreshChange, runtimeRisk, rpcStatus, positionRiskSummary } = props;
  const mode = runtimeRisk?.tier === "high" ? "writesDisabled" : runtimeRisk?.tier === "medium" || rpcStatus?.tier === "fallback" || (blocksBehind != null && blocksBehind > BLOCK_STALE_THRESHOLD) ? "degraded" : "ok";
  const modeLabel = mode === "writesDisabled" ? statusBarModeWritesDisabled : mode === "degraded" ? statusBarModeDegraded : statusBarModeOk;
  const modeClass = mode === "writesDisabled" ? "pillErr" : mode === "degraded" ? "pillWarn" : "pillOk";
  const healthEnum = mode === "writesDisabled" ? statusBarHealthEnumWritesDisabled : mode === "degraded" ? statusBarHealthEnumDegraded : statusBarHealthEnumOk;
  const modeTitle = mode === "writesDisabled" ? runtimeRiskHighBanner : mode === "degraded" ? (runtimeRisk?.reasons?.length ? `Degraded: ${runtimeRisk.reasons.join("; ")}. Confirm before submitting.` : statusBarDegradedTooltip) : networkStatusLabel;
  const hasDetails = blocksBehind != null && blocksBehind > BLOCK_STALE_THRESHOLD || rpcStatus?.tier === "fallback" || runtimeRisk?.tier === "medium" || runtimeRisk?.tier === "high" || (blockNumber != null) || (mode === "ok" && (runtimeRisk?.reasons?.length ?? 0) > 0);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      <span className={`pill statusBarModeBadge ${modeClass}`} title={modeTitle} aria-label={`Data status: ${healthEnum}`} role={mode === "writesDisabled" ? "alert" : undefined}>
        {modeLabel}
      </span>
      {mode === "ok" && runtimeRisk?.reasons && runtimeRisk.reasons.length > 0 && (
        <span className="pill muted statusBarOkRiskHint" title={statusBarOkExplanation}>
          {positionRiskSummary ?? statusBarOkPositionRiskHint}
        </span>
      )}
      {hasDetails && (
        <details className="statusBarDetails" open={detailsOpen} onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)}>
          <summary className="statusBarDetailsSummary">{statusBarDetailsSummary}</summary>
          <div className="statusBarDetailsContent">
            {blocksBehind != null && blocksBehind > BLOCK_STALE_THRESHOLD && (
              <span className="pill pillWarn" title={blockFreshnessBehindLabel.replace("{n}", String(blocksBehind))}>
                {blockFreshnessBehindLabel.replace("{n}", String(blocksBehind))}
              </span>
            )}
            {rpcStatus?.tier === "fallback" && (
              <span className="pill pillWarn" title={rpcFallbackBannerBody.replace("{reason}", rpcStatus.fallbackReason ?? "unavailable")}>
                {rpcFallbackBannerTitle}
              </span>
            )}
            {runtimeRisk?.tier === "medium" && (
              <span className="pill pillWarn" title={runtimeRiskMediumBanner}>{runtimeRiskMediumBanner}</span>
            )}
            {runtimeRisk?.tier === "high" && (
              <span className="pill pillErr" title={runtimeRiskHighBanner}>{runtimeRiskHighBanner}</span>
            )}
            {blockNumber != null && (
              <span className="pill pillOk" title={networkStatusLabel}>{networkStatusSynced}</span>
            )}
            {mode === "ok" && runtimeRisk?.reasons && runtimeRisk.reasons.length > 0 && (
              <p className="statusBarDetailsOkExplanation muted" role="note">{statusBarOkExplanation}</p>
            )}
          </div>
        </details>
      )}
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
