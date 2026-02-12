import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { normalizeError } from "../state/errors";

/**
 * Tracks how much the lending contract can spend for a token so the UI can show
 * "Needs approve" or "Sufficient" and we refresh when the user approves (via event or manual refresh).
 */
type AllowanceState = {
  allowance?: bigint;
  loading: boolean;
  error?: string;
};

export function useAllowance(params: { token?: Contract; owner?: string; spender?: string }) {
  const { token, owner, spender } = params;

  const [state, setState] = useState<AllowanceState>({ loading: false });

  const [refreshNonce, setRefreshNonce] = useState(0);

  const refresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token || !owner || !spender) return;
      setState({ loading: true });
      try {
        const allowance = (await token.allowance(owner, spender)) as bigint;
        if (cancelled) return;
        setState({ loading: false, allowance });
      } catch (e: unknown) {
        if (cancelled) return;
        setState({ loading: false, error: normalizeError(e).message });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [owner, refreshNonce, spender, token]);

  // We listen for Approval events so the UI updates as soon as the user approves; we also expose refresh() so you can fix drift if needed.
  useEffect(() => {
    if (!token || !owner || !spender) return;

    const onApproval = (approvalOwner: string, approvalSpender: string) => {
      if (approvalOwner.toLowerCase() !== owner.toLowerCase()) return;
      if (approvalSpender.toLowerCase() !== spender.toLowerCase()) return;
      refresh();
    };

    token.on("Approval", onApproval);
    return () => {
      token.off("Approval", onApproval);
    };
  }, [owner, refresh, spender, token]);

  return { ...state, refresh };
}
