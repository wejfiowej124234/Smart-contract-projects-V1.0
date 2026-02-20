import { useState } from "react";
import { COPY_FEEDBACK_MS } from "../../config/runtime";
import { copy, copied as copiedLabel } from "../../config/ui";
import { AddressDisplay } from "../ui/AddressDisplay";

const chainProofTitle = "Chain proof (MetaMask = node instance)";

function CopyableRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // ignore
    }
  };
  return (
    <div className="addressRow">
      <div className="addressLabel">{label}:</div>
      <div className="addressValue mono" style={{ wordBreak: "break-all" }}>{value}</div>
      <button type="button" className="btn btnSecondary btnSmall" onClick={() => void onCopy()} aria-label={copied ? copiedLabel : copy}>
        {copied ? copiedLabel : copy}
      </button>
    </div>
  );
}

export function ChainProofAnchors(props: {
  chainId: number | undefined;
  account: string | undefined;
  tokenAddress: string | undefined;
  genesisBlockHash: string | undefined;
}) {
  const { chainId, account, tokenAddress, genesisBlockHash } = props;
  if (chainId === undefined && !account && !tokenAddress && !genesisBlockHash) return null;

  return (
    <details className="metaGridDetails contentBlock" open={false}>
      <summary className="metaGridSummary">{chainProofTitle}</summary>
      <div className="metaGrid">
        {genesisBlockHash != null && <CopyableRow label="genesisBlockHash" value={genesisBlockHash} />}
        {chainId != null && <CopyableRow label="chainId" value={String(chainId)} />}
        {account != null && <AddressDisplay label="account" address={account} chainId={chainId} />}
        {tokenAddress != null && <AddressDisplay label="tokenAddress (USD8)" address={tokenAddress} chainId={chainId} />}
      </div>
    </details>
  );
}
