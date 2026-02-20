import { useCallback, useEffect, useState } from "react";
import { Contract } from "ethers";
import type { BrowserProvider } from "ethers";
import { ABIS } from "../../contracts/abis";

type PauseUnpauseBarProps = {
  provider: BrowserProvider | undefined;
  account: string | undefined;
  poolAddress: string | undefined;
  onSuccess?: () => void;
};

export function PauseUnpauseBar({ provider, account, poolAddress, onSuccess }: PauseUnpauseBarProps) {
  const [isPauser, setIsPauser] = useState(false);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [txPending, setTxPending] = useState(false);

  useEffect(() => {
    if (!provider || !account || !poolAddress) {
      setIsPauser(false);
      setPaused(null);
      return;
    }
    let cancelled = false;
    const pool = new Contract(poolAddress, ABIS.SimpleLending, provider);
    Promise.all([pool.isPauser(account), pool.paused?.() ?? Promise.resolve(false)])
      .then(([pauser, p]) => {
        if (!cancelled) {
          setIsPauser(!!pauser);
          setPaused(!!p);
        }
      })
      .catch(() => { if (!cancelled) setIsPauser(false); });
    return () => { cancelled = true; };
  }, [provider, account, poolAddress]);

  const doPause = useCallback(async () => {
    if (!provider || !account || !poolAddress) return;
    setTxPending(true);
    try {
      const signer = await provider.getSigner();
      const pool = new Contract(poolAddress, ABIS.SimpleLending, signer);
      const tx = await pool.pause();
      await tx.wait();
      setPaused(true);
      onSuccess?.();
    } finally {
      setTxPending(false);
    }
  }, [provider, account, poolAddress, onSuccess]);

  const doUnpause = useCallback(async () => {
    if (!provider || !account || !poolAddress) return;
    setTxPending(true);
    try {
      const signer = await provider.getSigner();
      const pool = new Contract(poolAddress, ABIS.SimpleLending, signer);
      const tx = await pool.unpause();
      await tx.wait();
      setPaused(false);
      onSuccess?.();
    } finally {
      setTxPending(false);
    }
  }, [provider, account, poolAddress, onSuccess]);

  if (!isPauser || paused === null) return null;

  return (
    <div className="pauseUnpauseBar" role="region" aria-label="Pool pause control">
      <span className="pauseUnpauseLabel">{paused ? "Pool is paused." : "Pool is active."}</span>
      {paused ? (
        <button type="button" onClick={doUnpause} disabled={txPending}>Unpause</button>
      ) : (
        <button type="button" onClick={doPause} disabled={txPending}>Pause</button>
      )}
    </div>
  );
}
