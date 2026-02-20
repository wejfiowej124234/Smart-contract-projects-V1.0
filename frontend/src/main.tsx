import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./state/toast";
import { getDeployments } from "./contracts/deployments";
import { setRunId, setAppVersion, setGitSha, toEvidenceText } from "./state/sendPathEvidence";
import { getSnapshot } from "./state/sessionEvidence";

if (typeof window !== "undefined") {
  const win = window as unknown as { __getDeployments__?: typeof getDeployments; __toSendpathEvidenceText?: () => string };
  if (import.meta.env?.DEV) win.__getDeployments__ = getDeployments;
  win.__toSendpathEvidenceText = toEvidenceText; // E2E can call to get sendpath-last-run.txt content
}

if (typeof window !== "undefined") {
  setRunId(getSnapshot().sessionId);
  setAppVersion(typeof import.meta.env?.VITE_APP_VERSION === "string" ? import.meta.env.VITE_APP_VERSION : "dev");
  setGitSha(typeof import.meta.env?.VITE_GIT_SHA === "string" ? import.meta.env.VITE_GIT_SHA : "—");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
