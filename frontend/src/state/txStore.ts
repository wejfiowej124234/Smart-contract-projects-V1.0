import type { TxStage } from "./tx";

export type PersistedTx = {
  stage: Extract<TxStage, "pending" | "confirmed" | "failed">;
  label: string;
  hash: string;
  chainId: number;
  account: string;
  updatedAtMs: number;
};

function key(chainId: number, account: string): string {
  return `tx:${chainId}:${account.toLowerCase()}`;
}

export function loadPendingTx(chainId: number, account: string): PersistedTx | undefined {
  try {
    const raw = localStorage.getItem(key(chainId, account));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedTx;
    if (parsed.chainId !== chainId) return undefined;
    if (parsed.account.toLowerCase() !== account.toLowerCase()) return undefined;
    if (!parsed.hash || !parsed.label) return undefined;
    if (parsed.stage !== "pending") return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function savePendingTx(chainId: number, account: string, label: string, hash: string): void {
  const data: PersistedTx = {
    stage: "pending",
    label,
    hash,
    chainId,
    account,
    updatedAtMs: Date.now(),
  };
  localStorage.setItem(key(chainId, account), JSON.stringify(data));
}

export function clearTx(chainId: number, account: string): void {
  localStorage.removeItem(key(chainId, account));
}
