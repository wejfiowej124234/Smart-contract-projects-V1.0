/** F8: Activity history — list of txs (time, type, asset, amount, txHash, status) keyed by chainId+account */

export type TxHistoryEntry = {
  time: number;
  type: string;
  asset: string;
  amount: string;
  txHash: string;
  status: "pending" | "success" | "failed";
  /** Block number when mined (audit traceability). */
  blockNumber?: number;
  /** Gas used (audit traceability). */
  gasUsed?: string;
  /** Terminal outcome for badge (replaced/dropped). */
  outcome?: "confirmed" | "failed" | "replaced" | "dropped";
  /** When outcome is "replaced", hash of the tx that replaced this one. */
  replacementHash?: string;
  /** When outcome is "dropped", reason for display. */
  droppedReason?: "timeout" | "notFound" | "rpcDegraded";
};

const HISTORY_KEY_PREFIX = "txHistory:";
const MAX_ENTRIES = 100;

function storageKey(chainId: number, account: string): string {
  return `${HISTORY_KEY_PREFIX}${chainId}:${account.toLowerCase()}`;
}

export function getTxHistory(chainId: number, account: string): TxHistoryEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(chainId, account));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TxHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendTxHistory(
  chainId: number,
  account: string,
  entry: Omit<TxHistoryEntry, "time"> & { time?: number },
): void {
  const list = getTxHistory(chainId, account);
  const full: TxHistoryEntry = {
    ...entry,
    time: entry.time ?? Date.now(),
  };
  const next = [full, ...list].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(storageKey(chainId, account), JSON.stringify(next));
  } catch {
    // ignore quota or parse errors
  }
}
