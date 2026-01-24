import { useCallback, useEffect, useState } from "react";
import type { Contract } from "ethers";
import { normalizeError } from "../state/errors";

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

  // Strategic note (why): allowance UX is fragile in real wallets.
  // We sync primarily via Approval events (and a confirmed callback from writes),
  // and also expose a manual `refresh()` escape hatch to avoid UI drift.
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
