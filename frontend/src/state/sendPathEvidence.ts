/**
 * Accumulates send-path tags and outcome for evidence export (debug / E2E).
 * Gated: only when DEV or VITE_DEBUG_RPC. Exposed on window.__SENDPATH_LAST_RUN__.
 */

const DEBUG =
  typeof import.meta.env !== "undefined" &&
  (import.meta.env.DEV || String(import.meta.env.VITE_DEBUG_RPC || "").toLowerCase() === "true");

type TagEntry = { tag: string; data: Record<string, unknown>; ts: number };

let runId: string = "";
let appVersion: string = "";
let gitSha: string = "";
let splitMatch: boolean | undefined = undefined;
const tags: TagEntry[] = [];
let gotTxHash: string | undefined = undefined;
let lastSendError: { code?: unknown; message?: string; name?: string } | undefined = undefined;

function exposeToWindow() {
  if (typeof window === "undefined") return;
  (window as unknown as { __SENDPATH_LAST_RUN__?: unknown }).__SENDPATH_LAST_RUN__ = getSnapshot();
}

export function setRunId(id: string) {
  runId = id;
  exposeToWindow();
}

export function setAppVersion(version: string) {
  appVersion = version;
  exposeToWindow();
}

export function setGitSha(sha: string) {
  gitSha = sha;
  exposeToWindow();
}

export function setSplitMatch(match: boolean) {
  splitMatch = match;
  exposeToWindow();
}

export function recordTag(tag: string, data: Record<string, unknown>) {
  if (!DEBUG) return;
  tags.push({ tag, data: { ...data }, ts: Date.now() });
  exposeToWindow();
}

export function recordTxCreated(hash: string) {
  if (!DEBUG) return;
  gotTxHash = hash;
  lastSendError = undefined;
  exposeToWindow();
}

export function recordSendError(err: { code?: unknown; message?: string; name?: string }) {
  if (!DEBUG) return;
  lastSendError = err;
  exposeToWindow();
}

export function getSnapshot(): {
  runId: string;
  appVersion: string;
  gitSha: string;
  splitMatch: boolean | undefined;
  tags: Array<{ tag: string; data: Record<string, unknown>; ts: number }>;
  gotTxHash: string | undefined;
  lastSendError: { code?: unknown; message?: string; name?: string } | undefined;
} {
  return {
    runId,
    appVersion,
    gitSha,
    splitMatch,
    tags: [...tags],
    gotTxHash,
    lastSendError,
  };
}

/** Serialize for sendpath-last-run.txt (E2E / manual export). */
export function toEvidenceText(): string {
  const s = getSnapshot();
  const lines = [
    "--- sendpath-last-run ---",
    `runId=${s.runId}`,
    `appVersion=${s.appVersion}`,
    `gitSha=${s.gitSha}`,
    `splitProviderMatch=${s.splitMatch === undefined ? "—" : s.splitMatch ? "Yes" : "No"}`,
    `gotTxHash=${s.gotTxHash ?? "—"}`,
    `lastSendError=${s.lastSendError ? JSON.stringify(s.lastSendError) : "—"}`,
    "tags (order):",
    ...s.tags.map((e) => `  ${e.ts} ${e.tag} ${JSON.stringify(e.data)}`),
    "---",
  ];
  return lines.join("\n");
}
