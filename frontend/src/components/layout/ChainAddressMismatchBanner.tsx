import {
  chainAddressMismatchBannerTitle,
  chainAddressMismatchBannerBody,
  chainAddressMismatchDeployCommand,
  fixCtaCopyCommandLabel,
  fixCtaDiagnosticsLabel,
  fixCtaCopiedToast,
} from "../../config/ui";
import { useToast } from "../../state/toast";
import { Link } from "react-router-dom";

export function ChainAddressMismatchBanner() {
  const addToast = useToast().addToast;

  const onCopyCommand = () => {
    void navigator.clipboard.writeText(chainAddressMismatchDeployCommand).then(() => {
      addToast(fixCtaCopiedToast, "info");
    });
  };

  return (
    <div className="banner bannerErr chainDeploymentFixBanner" role="alert" aria-live="polite" data-testid="chain-address-mismatch-banner">
      <div className="chainDeploymentFixBannerContent">
        <div className="chainDeploymentFixBannerText">
          <strong>{chainAddressMismatchBannerTitle}</strong>
          <span className="muted"> — {chainAddressMismatchBannerBody}</span>
        </div>
        <div className="chainDeploymentFixBannerActions">
          <code className="chainDeploymentFixBannerCommand">{chainAddressMismatchDeployCommand}</code>
          <button type="button" className="btn btnSecondary btnSmall" onClick={onCopyCommand}>
            {fixCtaCopyCommandLabel}
          </button>
          <Link to="/diagnostics" className="btn btnSecondary btnSmall">
            {fixCtaDiagnosticsLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
