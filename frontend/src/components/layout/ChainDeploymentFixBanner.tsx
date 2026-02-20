import { Link } from "react-router-dom";
import {
  chainDeploymentMismatchTitle,
  chainDeploymentMismatchBody,
  fixCtaCopyCommandLabel,
  fixCtaTroubleshootingLabel,
  fixCtaDiagnosticsLabel,
  fixCtaDeployCommand,
  fixCtaCopiedToast,
} from "../../config/ui";
import { useToast } from "../../state/toast";

export function ChainDeploymentFixBanner() {
  const addToast = useToast().addToast;

  const onCopyCommand = () => {
    void navigator.clipboard.writeText(fixCtaDeployCommand).then(() => {
      addToast(fixCtaCopiedToast, "info");
    });
  };

  return (
    <div className="banner bannerWarn chainDeploymentFixBanner" role="alert" aria-live="polite">
      <div className="chainDeploymentFixBannerContent">
        <div className="chainDeploymentFixBannerText">
          <strong>{chainDeploymentMismatchTitle}</strong>
          <span className="muted"> — {chainDeploymentMismatchBody}</span>
        </div>
        <div className="chainDeploymentFixBannerActions">
          <button type="button" className="btn btnSecondary btnSmall" onClick={onCopyCommand}>
            {fixCtaCopyCommandLabel}
          </button>
          <Link to="/diagnostics#troubleshooting" className="btn btnSecondary btnSmall">
            {fixCtaTroubleshootingLabel}
          </Link>
          <Link to="/diagnostics" className="btn btnSecondary btnSmall">
            {fixCtaDiagnosticsLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
