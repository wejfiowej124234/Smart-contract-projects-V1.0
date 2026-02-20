/**
 * Forensic-grade session evidence chain (protocol-level traceability).
 * Append-only in-memory ring; export as JSON for audit/support.
 */

const MAX_EVENTS = 200;

export type SessionEventType =
  | "SessionStart"
  | "Connect"
  | "Disconnect"
  | "SwitchChain"
  | "PreflightOpen"
  | "TxSubmit"
  | "TxConfirm"
  | "TxFail"
  | "TxRevert"
  | "ViewPage"
  | "DataStale"
  | "RpcFallback"
  | "RpcRecovered";

export type SessionEventPayload = Record<string, unknown>;

export type SessionEvent = {
  ts: number;
  type: SessionEventType;
  payload?: SessionEventPayload;
};

function genId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let sessionId: string;
let startTime: number;
let events: SessionEvent[] = [];
let started = false;

function ensureStarted(): void {
  if (started) return;
  started = true;
  sessionId = genId();
  startTime = Date.now();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  events.push({ ts: startTime, type: "SessionStart", payload: { sessionId, origin } });
}

/**
 * Append one event (session start is auto-inserted on first append).
 */
export function append(type: SessionEventType, payload?: SessionEventPayload): void {
  ensureStarted();
  events.push({ ts: Date.now(), type, payload });
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
}

/**
 * Read-only snapshot for display (e.g. event count).
 */
export function getSnapshot(): { sessionId: string; startTime: number; eventCount: number } {
  ensureStarted();
  return { sessionId, startTime, eventCount: events.length };
}

/**
 * Export full session as JSON (forensic export).
 */
export function exportJSON(): string {
  ensureStarted();
  const endTime = Date.now();
  const out = {
    sessionId,
    startTime,
    endTime,
    events: [...events],
  };
  return JSON.stringify(out, null, 2);
}

/**
 * Download session evidence as a file (e.g. from Diagnostics).
 */
export function downloadSessionEvidence(): void {
  const json = exportJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-evidence-${getSnapshot().sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Last 4 of account for Connect payload (privacy). */
export function accountLast4(account: string): string {
  if (!account || account.length < 4) return "—";
  return "…" + account.slice(-4);
}
