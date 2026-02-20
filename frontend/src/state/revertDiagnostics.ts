/**
 * Revert diagnostics bundle: capture chain revert reasons for audit/support.
 * Written from runTxDetailed (and any write path) catch blocks.
 * Included in debug bundle and session evidence so failures are traceable and replayable.
 */

const MAX_ENTRIES = 50;

export type RevertDiagnosticEntry = {
  ts: number;
  label: string;
  txHash?: string;
  shortMessage?: string;
  reason?: string;
  data?: string;
  chainId?: number;
  contractAddress?: string;
  method?: string;
  args?: unknown[];
};

const entries: RevertDiagnosticEntry[] = [];

export function appendRevertDiagnostic(entry: RevertDiagnosticEntry): void {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
}

export function getRevertDiagnosticsSnapshot(): RevertDiagnosticEntry[] {
  return [...entries];
}
