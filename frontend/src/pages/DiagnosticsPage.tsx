import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useRuntimeRisk } from "../hooks/useRuntimeRisk";
import { useSplitProviderState } from "../state/splitProviderContext";
import { getDeployments, getSupportedChainIds } from "../contracts/deployments";
import { isSupportedChain, LOCAL_CHAIN_ID } from "../config/network";
import {
  fixCtaDeployCommand,
  fixCtaCopyCommandLabel,
  fixCtaCopiedToast,
  diagnosticsPageTitle,
  diagnosticsFrontendVersionLabel,
  diagnosticsCurrentChainLabel,
  diagnosticsExpectedChainsLabel,
  diagnosticsDeploymentsLabel,
  diagnosticsTroubleshootingTitle,
  diagnosticsTroubleshootingSteps,
  backToDashboard,
  diagnosticsSessionEvidenceLabel,
  diagnosticsSessionEvidenceHint,
  diagnosticsDownloadSessionEvidenceLabel,
  diagnosticsCopyDebugBundleLabel,
  diagnosticsCopyDebugBundleHint,
  diagnosticsConfigFingerprintLabel,
  diagnosticsConfigFingerprintHint,
  diagnosticsRpcUrlInUseLabel,
  diagnosticsRpcUrlInUseHint,
  diagnosticsRpcFailCountLabel,
  diagnosticsRpcLastOkAtLabel,
  diagnosticsReadRpcSectionTitle,
  diagnosticsReadRpcUrlLabel,
  diagnosticsReadChainIdLabel,
  diagnosticsWalletChainIdLabel,
  diagnosticsReadMatchLabel,
  diagnosticsSendpathEvidenceLabel,
  diagnosticsSendpathEvidenceHint,
  diagnosticsCopySendpathLabel,
  diagnosticsCopySendpathCopied,
  diagnosticsRuntimeRiskLabel,
  diagnosticsRuntimeRiskTierLabel,
  diagnosticsRuntimeRiskTierHint,
  runtimeRiskReasonsLabel,
} from "../config/ui";
import { useToast } from "../state/toast";
import { getSnapshot, downloadSessionEvidence } from "../state/sessionEvidence";
import { toEvidenceText } from "../state/sendPathEvidence";
import { computeConfigFingerprint } from "../utils/configFingerprint";
import { getRpcHealthSnapshot } from "../config/rpcHealth";
import { getTxHistory } from "../state/txHistory";
import { getLastProposalCreatedEvidence } from "../state/governanceEvidence";
import { getRevertDiagnosticsSnapshot } from "../state/revertDiagnostics";

export function DiagnosticsPage() {
  const wallet = useWallet();
  const split = useSplitProviderState();
  const addToast = useToast().addToast;
  const chainId = wallet.chainId;
  const rpcStatus = wallet.rpcStatus ?? { tier: "primary" as const };
  const deployments = chainId != null ? getDeployments(chainId) : undefined;
  const supportedIds = getSupportedChainIds();
  const isCorrect = chainId != null && isSupportedChain(chainId);
  const runtimeRisk = useRuntimeRisk({
    chainId: wallet.chainId,
    blocksBehind: rpcStatus.blockDrift ?? undefined,
    dashboardError: undefined,
    healthFactor: undefined,
  });

  const frontendVersion =
    typeof import.meta.env !== "undefined" && import.meta.env?.VITE_APP_VERSION
      ? String(import.meta.env.VITE_APP_VERSION)
      : "dev";

  const sessionSnap = getSnapshot();
  const [configFingerprint, setConfigFingerprint] = useState<string>("—");
  useEffect(() => {
    let cancelled = false;
    void computeConfigFingerprint(chainId ?? undefined, deployments, frontendVersion).then((fp) => {
      if (!cancelled) setConfigFingerprint(fp);
    });
    return () => { cancelled = true; };
  }, [chainId, deployments, frontendVersion]);

  const onCopy = () => {
    void navigator.clipboard.writeText(fixCtaDeployCommand).then(() => {
      addToast(fixCtaCopiedToast, "info");
    });
  };

  const copySendpathEvidence = useCallback(() => {
    const text = toEvidenceText();
    void navigator.clipboard.writeText(text).then(() => {
      addToast(diagnosticsCopySendpathCopied, "info");
    });
  }, [addToast]);

  const copyDebugBundle = useCallback(async () => {
    const rpcSnapshot = getRpcHealthSnapshot();
    const lastTxs = chainId != null && wallet.account
      ? getTxHistory(chainId, wallet.account).slice(0, 5)
      : [];
    const lastProposal = getLastProposalCreatedEvidence();
    const MAX_PROPOSAL_JSON_LEN = 2000;
    let proposalLine = "—";
    let proposalSha256Line = "—";
    if (lastProposal) {
      const fullJson = JSON.stringify(lastProposal);
      const displayJson = fullJson.length > MAX_PROPOSAL_JSON_LEN
        ? fullJson.slice(0, MAX_PROPOSAL_JSON_LEN) + " [truncated]"
        : fullJson;
      proposalLine = displayJson;
      try {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fullJson));
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        proposalSha256Line = hex;
      } catch {
        proposalSha256Line = "(digest unavailable)";
      }
    }
    const revertSnap = getRevertDiagnosticsSnapshot();
    const revertLine = revertSnap.length
      ? revertSnap.slice(-5).map((r) => `${r.ts} ${r.label} txHash=${r.txHash ?? "—"} shortMessage=${r.shortMessage ?? "—"} reason=${r.reason ?? "—"} chainId=${r.chainId ?? "—"} contract=${r.contractAddress ?? "—"} method=${r.method ?? "—"}`).join(" | ")
      : "—";
    const lines = [
      "--- Debug bundle (paste into support ticket) ---",
      "version=" + frontendVersion,
      "fingerprint=" + configFingerprint,
      "rpcTier=" + (rpcStatus.tier ?? "—"),
      "blocksBehind=" + (rpcStatus.blockDrift ?? "—"),
      "runtimeRiskSnapshot=" + JSON.stringify({ tier: runtimeRisk.tier, reasons: runtimeRisk.reasons }),
      "rpcHealthSnapshot=" + JSON.stringify(rpcSnapshot),
      "lastTx/outcome=" + (lastTxs.length ? lastTxs.map((t) => `${t.type} ${t.outcome ?? t.status} ${t.txHash}`).join("; ") : "—"),
      "revertDiagnostics(last5)=" + revertLine,
      "lastProposalCreated=" + proposalLine,
      "lastProposalCreatedSha256=" + proposalSha256Line,
      "preflightKey=N/A (from Preflight modal when open)",
      "---",
    ];
    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    addToast("Debug bundle copied", "info");
  }, [chainId, wallet.account, frontendVersion, configFingerprint, rpcStatus.tier, rpcStatus.blockDrift, runtimeRisk.tier, runtimeRisk.reasons, addToast]);

  return (
    <section className="contentBlock diagnosticsPage" aria-label={diagnosticsPageTitle}>
      <h2 className="sectionTitle">{diagnosticsPageTitle}</h2>

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsFrontendVersionLabel}</h3>
        <p className="diagnosticsValue" data-testid="diagnostics-frontend-version">
          {frontendVersion}
        </p>
      </div>

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsCurrentChainLabel}</h3>
        <p className="diagnosticsValue">
          {chainId != null ? `${chainId} (0x${chainId.toString(16)})` : "—"}
          {chainId != null && !isCorrect && <span className="muted"> — not supported</span>}
        </p>
      </div>

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsExpectedChainsLabel}</h3>
        <p className="diagnosticsValue">{supportedIds.length ? supportedIds.join(", ") : "—"}</p>
      </div>

      {(split.readRpcUrl != null || split.readChainId != null || chainId === LOCAL_CHAIN_ID) && (
        <div className="diagnosticsSection" data-testid="diagnostics-read-rpc">
          <h3 className="diagnosticsSectionTitle">{diagnosticsReadRpcSectionTitle}</h3>
          <p className="diagnosticsValue">
            {diagnosticsReadRpcUrlLabel}: <code className="diagnosticsCode">{split.readRpcUrl ?? "—"}</code>
          </p>
          <p className="diagnosticsValue">
            {diagnosticsReadChainIdLabel}: <code className="diagnosticsCode">{split.readChainId != null ? `${split.readChainId} (0x${split.readChainId.toString(16)})` : "—"}</code>
          </p>
          <p className="diagnosticsValue">
            {diagnosticsWalletChainIdLabel}: <code className="diagnosticsCode">{chainId != null ? `${chainId} (0x${chainId.toString(16)})` : "—"}</code>
          </p>
          <p className="diagnosticsValue">
            {diagnosticsReadMatchLabel}: <code className="diagnosticsCode">{split.readChainId != null && chainId != null ? (split.readChainId === chainId ? "Yes" : "No (mismatch — writes disabled)") : "—"}</code>
          </p>
        </div>
      )}

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsDeploymentsLabel}</h3>
        <p className="diagnosticsValue">
          {deployments ? "Yes" : "No"}
          {deployments && <span className="muted"> (chainId {deployments.chainId})</span>}
        </p>
        {deployments?.simpleLendingAddress && (
          <p className="diagnosticsValue" data-testid="diagnostics-contract-address">
            Lending: <code className="diagnosticsCode">{deployments.simpleLendingAddress}</code>
          </p>
        )}
      </div>

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsConfigFingerprintLabel}</h3>
        <p className="diagnosticsValue" data-testid="diagnostics-config-fingerprint" title={diagnosticsConfigFingerprintHint}>
          {configFingerprint}
        </p>
        <p className="muted diagnosticsHint">{diagnosticsConfigFingerprintHint}</p>
      </div>

      <div className="diagnosticsSection" data-testid="diagnostics-rpc">
        <h3 className="diagnosticsSectionTitle">{diagnosticsRpcUrlInUseLabel}</h3>
        <p className="diagnosticsValue">
          RPC tier: <code className="diagnosticsCode">{rpcStatus.tier}</code>
          {rpcStatus.rpcUrlInUse != null && (
            <> · {diagnosticsRpcUrlInUseLabel}: <code className="diagnosticsCode">{rpcStatus.rpcUrlInUse}</code></>
          )}
        </p>
        <p className="diagnosticsValue">
          {diagnosticsRpcFailCountLabel}: <code className="diagnosticsCode">{rpcStatus.rpcFailCount ?? 0}</code>
          {rpcStatus.rpcLastOkAt != null && (
            <> · {diagnosticsRpcLastOkAtLabel}: <code className="diagnosticsCode">{new Date(rpcStatus.rpcLastOkAt).toISOString()}</code></>
          )}
        </p>
        <p className="muted diagnosticsHint">{diagnosticsRpcUrlInUseHint}</p>
      </div>

      <div className="diagnosticsSection" data-testid="diagnostics-runtime-risk">
        <h3 className="diagnosticsSectionTitle">{diagnosticsRuntimeRiskLabel}</h3>
        <p className="diagnosticsValue">
          {diagnosticsRuntimeRiskTierLabel}: <code className="diagnosticsCode">{runtimeRisk.tier}</code>
          <span className="muted"> ({runtimeRisk.tier === "low" ? "normal (OK)" : runtimeRisk.tier === "medium" ? "Degraded — confirm before submitting" : "Writes disabled"})</span>
        </p>
        {runtimeRisk.reasons.length > 0 && (
          <p className="diagnosticsValue">
            {runtimeRiskReasonsLabel}: <code className="diagnosticsCode">{runtimeRisk.reasons.join("; ")}</code>
          </p>
        )}
        <p className="muted diagnosticsHint">{diagnosticsRuntimeRiskTierHint}</p>
      </div>

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsSessionEvidenceLabel}</h3>
        <p className="diagnosticsValue">
          Session: <code className="diagnosticsCode">{sessionSnap.sessionId}</code> · {sessionSnap.eventCount} events
        </p>
        <p className="muted diagnosticsHint">{diagnosticsSessionEvidenceHint}</p>
        <button type="button" className="btn btnSecondary btnSmall" onClick={() => downloadSessionEvidence()} data-testid="diagnostics-download-session-evidence">
          {diagnosticsDownloadSessionEvidenceLabel}
        </button>
      </div>

      <div className="diagnosticsSection" data-testid="diagnostics-sendpath-evidence">
        <h3 className="diagnosticsSectionTitle">{diagnosticsSendpathEvidenceLabel}</h3>
        <p className="muted diagnosticsHint">{diagnosticsSendpathEvidenceHint}</p>
        <button type="button" className="btn btnSecondary btnSmall" onClick={copySendpathEvidence} data-testid="diagnostics-copy-sendpath">
          {diagnosticsCopySendpathLabel}
        </button>
      </div>

      <div className="diagnosticsSection" data-testid="diagnostics-debug-bundle">
        <h3 className="diagnosticsSectionTitle">{diagnosticsCopyDebugBundleLabel}</h3>
        <p className="muted diagnosticsHint">{diagnosticsCopyDebugBundleHint}</p>
        <button type="button" className="btn btnSecondary btnSmall" onClick={copyDebugBundle} data-testid="diagnostics-copy-debug-bundle">
          {diagnosticsCopyDebugBundleLabel}
        </button>
      </div>

      <div className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{fixCtaCopyCommandLabel}</h3>
        <code className="diagnosticsCode">{fixCtaDeployCommand}</code>
        <button type="button" className="btn btnSecondary btnSmall" onClick={onCopy} style={{ marginTop: "0.5rem" }}>
          {fixCtaCopyCommandLabel}
        </button>
      </div>

      <div id="troubleshooting" className="diagnosticsSection">
        <h3 className="diagnosticsSectionTitle">{diagnosticsTroubleshootingTitle}</h3>
        <ol className="diagnosticsSteps">
          {diagnosticsTroubleshootingSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <p>
        <Link to="/" className="btn btnPrimary">{backToDashboard}</Link>
      </p>
    </section>
  );
}
