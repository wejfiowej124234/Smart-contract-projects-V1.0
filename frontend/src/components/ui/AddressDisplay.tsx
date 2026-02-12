import { useState } from "react";
import { COPY_FEEDBACK_MS } from "../../config/runtime";
import { getBlockExplorerAddressUrl } from "../../config/network";
import { copy, copied as copiedLabel, show, hide, viewOnExplorerLabel, emptyPlaceholder } from "../../config/ui";
import { shortAddress, toChecksum } from "../../utils/format";
import type { AddressDisplayProps } from "../../types/dashboard";

export function AddressDisplay({ label, address, chainId }: AddressDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const shown = address ? toChecksum(address) : emptyPlaceholder;
  const explorerUrl = address && chainId !== undefined ? getBlockExplorerAddressUrl(chainId, address) : undefined;

  const onCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(toChecksum(address));
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // ignore
    }
  };

  return (
    <div className="addressRow">
      {label ? <div className="addressLabel">{label}:</div> : null}
      <div className="addressValue mono">
        {address ? (expanded ? shown : shortAddress(shown)) : emptyPlaceholder}
      </div>
      {address && (
        <>
          <button type="button" className="btn btnSecondary btnSmall" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? hide : show}>
            {expanded ? hide : show}
          </button>
          <button type="button" className="btn btnSecondary btnSmall" onClick={() => void onCopy()} aria-label={copied ? copiedLabel : copy}>
            {copied ? copiedLabel : copy}
          </button>
          {explorerUrl && (
            <a className="btn btnSecondary btnSmall" href={explorerUrl} target="_blank" rel="noopener noreferrer" aria-label={viewOnExplorerLabel}>
              {viewOnExplorerLabel}
            </a>
          )}
        </>
      )}
    </div>
  );
}
