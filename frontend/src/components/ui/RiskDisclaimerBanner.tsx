import { useState } from "react";
import {
  complianceRiskDisclaimerTitle,
  complianceRiskDisclaimerBody,
  complianceUnauditedTitle,
  complianceUnauditedBody,
  dismiss,
} from "../../config/ui";
import { CONTRACTS_AUDITED } from "../../config/runtime";

const STORAGE_KEY = "risk-disclaimer-dismissed";

export function RiskDisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const onDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="complianceBanner complianceBanner--risk" role="alert" aria-live="polite">
      <div className="complianceBannerContent">
        <strong>{complianceRiskDisclaimerTitle}:</strong>{" "}
        <span className="muted">{complianceRiskDisclaimerBody}</span>
        {!CONTRACTS_AUDITED && (
          <span className="complianceBannerSeparator">
            {" · "}
            <strong className="complianceBannerUnaudited">{complianceUnauditedTitle}:</strong>{" "}
            <span className="muted">{complianceUnauditedBody}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        className="btn btnSecondary btnSmall complianceBannerDismiss"
        onClick={onDismiss}
        aria-label={dismiss}
      >
        {dismiss}
      </button>
    </div>
  );
}
