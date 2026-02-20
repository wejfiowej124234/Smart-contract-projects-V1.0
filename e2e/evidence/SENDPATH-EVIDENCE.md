# Send-path evidence (sendpath-last-run.txt)

After an Approve/Supply (or any write) flow, the frontend exposes the last run on **`window.__SENDPATH_LAST_RUN__`** (only when DEV or `VITE_DEBUG_RPC=true`).

## Shape

```ts
{
  runId: string;
  appVersion: string;
  gitSha: string;
  splitMatch: boolean | undefined;  // true = read chainId = wallet chainId
  tags: Array<{ tag: string; data: Record<string, unknown>; ts: number }>;
  gotTxHash: string | undefined;
  lastSendError: { code?: unknown; message?: string; name?: string } | undefined;
}
```

## Writing e2e/evidence/sendpath-last-run.txt

1. **From E2E (Playwright)**  
   After a step that triggers Approve/Supply (and optionally waits for signing/pending), evaluate in the page:
   - `await page.evaluate(() => (window as any).__SENDPATH_LAST_RUN__)` to get the object, then serialize to the same format as **Copy sendpath evidence** (see `frontend/src/state/sendPathEvidence.ts` `toEvidenceText()`), **or**
   - If the app exposes a helper: `await page.evaluate(() => window.__toSendpathEvidenceText?.())` and use the returned string.

2. **Write the file**  
   In the E2E test (Node), after capturing the content:
   ```ts
   import fs from "fs";
   import path from "path";
   const evidenceDir = path.join(__dirname, "evidence");
   fs.mkdirSync(evidenceDir, { recursive: true });
   fs.writeFileSync(path.join(evidenceDir, "sendpath-last-run.txt"), content, "utf8");
   ```

3. **Text format** (same as Diagnostics "Copy sendpath evidence"):
   ```
   --- sendpath-last-run ---
   runId=...
   appVersion=...
   gitSha=...
   splitProviderMatch=Yes|No|—
   gotTxHash=0x...|—
   lastSendError=—|{"code":...,"message":...}
   tags (order):
     <ts> <tag> <json data>
   ---
   ```

## Classification

- **Pre-send**: No `runTxDetailed.send` in tags — failure before `send()`.
- **Send-error**: `runTxDetailed.send` then `runTxDetailed.sendError` — wallet/reject/network.
- **Tx-created**: `runTxDetailed.txCreated` with hash — wallet accepted; use for screenshots (e.g. Diagnostics match=Yes + deployments=Yes) if needed.
