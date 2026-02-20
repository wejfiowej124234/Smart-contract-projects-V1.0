import { useMemo, useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { loadPendingTx } from "../state/txStore";
import { getTxHistory, type TxHistoryEntry } from "../state/txHistory";
import { Link } from "react-router-dom";
import {
  activityTitle,
  activityEmptyHint,
  activityGoToDashboardCta,
  activityFilterAll,
  activityFilterPending,
  activityFilterSuccess,
  activityFilterFailed,
  activityConnectHint,
  activityTypeLabel,
  activityAssetLabel,
  activityAmountLabel,
  activityHashLabel,
  activityStatusLabel,
  activityTimeLabel,
  activityBlockLabel,
  activityGasLabel,
  activityStatusTimelinePending,
  activityStatusTimelineConfirmed,
  activityStatusTimelineFailed,
  activityOutcomeReplaced,
  activityOutcomeDropped,
  activityReplacedByTemplate,
  txDroppedLineDefault,
  txDroppedLineNotFound,
  txDroppedLineRpcDegraded,
  activityEmptyYieldHint,
  viewOnExplorerLabel,
  copy,
  copied as copiedLabel,
} from "../config/ui";
import { COPY_FEEDBACK_MS } from "../config/runtime";
import { shortAddress, toChecksum } from "../utils/format";
import { getExplorerTxUrl } from "../config/network";
import { useSetNavBadges } from "../state/navBadges";

type Filter = "all" | "pending" | "success" | "failed";

function TxHashCell({ hash }: { hash: string; chainId?: number }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(toChecksum(hash));
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      /* noop */
    }
  };
  return (
    <td data-label={activityHashLabel} className="activityHashCell">
      <span className="activityHashCellInner">
        <code className="txHashCode" title={hash}>
          {shortAddress(hash)}
        </code>
        <button type="button" className="btn btnSecondary btnSmall activityHashCopy" onClick={() => void onCopy()} aria-label={copied ? copiedLabel : copy}>
          {copied ? copiedLabel : copy}
        </button>
      </span>
    </td>
  );
}

/** F8: Activity (tx history) — txStore + list + filter All/Pending/Success/Failed */
export function ActivityPage() {
  const wallet = useWallet();
  const setNavBadges = useSetNavBadges();
  const [filter, setFilter] = useState<Filter>("all");

  const { history, pending } = useMemo(() => {
    if (!wallet.account || wallet.chainId === undefined) {
      return { history: [] as TxHistoryEntry[], pending: null };
    }
    const list = getTxHistory(wallet.chainId, wallet.account);
    const pendingEntry = loadPendingTx(wallet.chainId, wallet.account);
    return {
      history: list,
      pending: pendingEntry
        ? {
            time: pendingEntry.updatedAtMs,
            type: pendingEntry.label,
            asset: "USD8",
            amount: "",
            txHash: pendingEntry.hash,
            status: "pending" as const,
            blockNumber: undefined as number | undefined,
            gasUsed: undefined as string | undefined,
            outcome: undefined as TxHistoryEntry["outcome"],
            replacementHash: undefined as string | undefined,
            droppedReason: undefined as TxHistoryEntry["droppedReason"],
          }
        : null,
    };
  }, [wallet.account, wallet.chainId]);

  const rows = useMemo(() => {
    const combined = pending ? [pending, ...history] : history;
    if (filter === "all") return combined;
    if (filter === "pending") return combined.filter((r) => r.status === "pending");
    if (filter === "success") return combined.filter((r) => r.status === "success");
    if (filter === "failed") return combined.filter((r) => r.status === "failed");
    return combined;
  }, [pending, history, filter]);

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  };

  useEffect(() => {
    if (!wallet.account) {
      setNavBadges({ activity: undefined });
      return;
    }
    if (pending) {
      setNavBadges({ activity: "1 pending" });
      return;
    }
    const last = rows[0];
    if (last?.status) setNavBadges({ activity: last.status });
    else setNavBadges({ activity: undefined });
  }, [wallet.account, pending, rows, setNavBadges]);

  if (!wallet.account) {
    return (
      <section className="sectionPlaceholder">
        <h2 className="sectionTitle">{activityTitle}</h2>
        <p className="muted">{activityConnectHint}</p>
      </section>
    );
  }

  return (
    <section className="activityPage" data-testid="activity-page">
      <h2 className="sectionTitle">{activityTitle}</h2>
      <div className="activityFilters" role="group" aria-label="Filter by status">
        {(
          [
            ["all", activityFilterAll],
            ["pending", activityFilterPending],
            ["success", activityFilterSuccess],
            ["failed", activityFilterFailed],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "activityFilterBtn active" : "activityFilterBtn"}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Table: desktop-first full columns; narrow screen uses responsive card layout (see states-toast-skeleton.css). For mainnet, consider hiding Gas/Block/Link in row expand. */}
      {rows.length === 0 ? (
        <>
          <div className="activityTableWrap" role="region" aria-label="Transaction list (empty)">
            <table className="activityTable">
              <thead>
                <tr>
                  <th scope="col">{activityTimeLabel}</th>
                  <th scope="col">{activityTypeLabel}</th>
                  <th scope="col">{activityAssetLabel}</th>
                  <th scope="col">{activityAmountLabel}</th>
                  <th scope="col">{activityHashLabel}</th>
                  <th scope="col">{activityBlockLabel}</th>
                  <th scope="col">{activityGasLabel}</th>
                  <th scope="col">{activityStatusLabel}</th>
                  <th scope="col" aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="activitySkeletonRow">
                    <td data-label={activityTimeLabel}><span className="skeleton" style={{ width: "5rem" }} /></td>
                    <td data-label={activityTypeLabel}><span className="skeleton" style={{ width: "3rem" }} /></td>
                    <td data-label={activityAssetLabel}><span className="skeleton" style={{ width: "2.5rem" }} /></td>
                    <td data-label={activityAmountLabel}><span className="skeleton" style={{ width: "4rem" }} /></td>
                    <td data-label={activityHashLabel}><span className="skeleton" style={{ width: "6rem" }} /></td>
                    <td data-label={activityBlockLabel}><span className="skeleton" style={{ width: "2rem" }} /></td>
                    <td data-label={activityGasLabel}><span className="skeleton" style={{ width: "3rem" }} /></td>
                    <td data-label={activityStatusLabel}><span className="skeleton" style={{ width: "3.5rem" }} /></td>
                    <td><span className="skeleton" style={{ width: "2rem" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="activityEmptyState" role="status">
            <p className="activityOnboardingHint">{activityEmptyYieldHint}</p>
            <p className="muted activityEmpty">{activityEmptyHint}</p>
            <p style={{ marginTop: "var(--spacing-sm)" }}>
              <Link to="/" className="btn btnPrimary">{activityGoToDashboardCta}</Link>
            </p>
          </div>
        </>
      ) : (
        <div className="activityTableWrap" role="region" aria-label="Transaction list">
          <table className="activityTable">
            <thead>
              <tr>
                <th scope="col">{activityTimeLabel}</th>
                <th scope="col">{activityTypeLabel}</th>
                <th scope="col">{activityAssetLabel}</th>
                <th scope="col">{activityAmountLabel}</th>
                <th scope="col">{activityHashLabel}</th>
                <th scope="col">{activityBlockLabel}</th>
                <th scope="col">{activityGasLabel}</th>
                <th scope="col">{activityStatusLabel}</th>
                <th scope="col" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.txHash + String(row.time) + i}>
                  <td data-label={activityTimeLabel}>{formatTime(row.time)}</td>
                  <td data-label={activityTypeLabel}>{row.type}</td>
                  <td data-label={activityAssetLabel} translate="no">{row.asset}</td>
                  <td data-label={activityAmountLabel}>{row.amount || "—"}</td>
                  <TxHashCell hash={row.txHash} chainId={wallet.chainId} />
                  <td data-label={activityBlockLabel} className="activityMono">{row.blockNumber != null ? row.blockNumber : "—"}</td>
                  <td data-label={activityGasLabel} className="activityMono">{row.gasUsed != null ? row.gasUsed : "—"}</td>
                  <td data-label={activityStatusLabel}>
                    <span className={`activityStatus activityStatus-${row.status}`} aria-label={`Status: ${row.status}`}>
                      {row.status}
                    </span>
                    {row.outcome === "replaced" && (
                      <span className="activityOutcomeBadge activityOutcomeBadge--replaced" title={row.replacementHash}>
                        {activityOutcomeReplaced}
                        {row.replacementHash && (
                          <> · {activityReplacedByTemplate.replace("{hash}", shortAddress(row.replacementHash))}</>
                        )}
                      </span>
                    )}
                    {row.outcome === "dropped" && (
                      <>
                        <span className="activityOutcomeBadge activityOutcomeBadge--dropped">{activityOutcomeDropped}</span>
                        <span className="activityDroppedReason muted">
                          {row.droppedReason === "notFound"
                            ? txDroppedLineNotFound
                            : row.droppedReason === "rpcDegraded"
                              ? txDroppedLineRpcDegraded
                              : txDroppedLineDefault}
                        </span>
                      </>
                    )}
                    <div className="activityStatusTimeline" role="status" aria-label={`Tx lifecycle: ${row.status === "pending" ? activityStatusTimelinePending : row.status === "success" ? activityStatusTimelineConfirmed : activityStatusTimelineFailed}`}>
                      <span className={row.status === "pending" ? "activityStatusTimelineStep active" : "activityStatusTimelineStep done"}>{activityStatusTimelinePending}</span>
                      <span className="activityStatusTimelineArrow" aria-hidden>→</span>
                      <span className={row.status !== "pending" ? `activityStatusTimelineStep active ${row.status === "success" ? "done" : "fail"}` : "activityStatusTimelineStep"}>{row.status === "success" ? activityStatusTimelineConfirmed : activityStatusTimelineFailed}</span>
                    </div>
                  </td>
                  <td data-label={viewOnExplorerLabel}>
                    {row.txHash && wallet.chainId && (
                      <a
                        href={getExplorerTxUrl(wallet.chainId, row.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="activityExplorerLink"
                        aria-label={`${viewOnExplorerLabel}: ${shortAddress(row.txHash)}`}
                      >
                        {viewOnExplorerLabel}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
