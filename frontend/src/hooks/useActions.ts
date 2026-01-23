import { Contract, parseUnits } from "ethers";
import { useCallback, useMemo, useState } from "react";
import type { BrowserProvider } from "ethers";
import { deployments } from "../contracts/deployments";
import { getWriteLending, getWriteToken } from "../contracts/write";
import { runTx, TX_IDLE, type TxState } from "../state/tx";

/**
 * CN：写模型（Write-model）：负责交易流（approve(if needed) → supply/withdraw/borrow/repay）与 tx 状态展示。
 * EN: Write-model: handles tx flows (approve(if needed) → supply/withdraw/borrow/repay) and tx state.
 */

function parseAmount(input: string, decimals: number): bigint {
  if (!input || !input.trim()) throw new Error("Amount is required");
  return parseUnits(input.trim(), decimals);
}

export function useActions(params: {
  provider?: BrowserProvider;
  account?: string;
  usd8?: Contract;
  lending?: Contract;
  decimals: number;
  onConfirmed?: () => void;
}) {
  const { provider, account, usd8, lending, decimals, onConfirmed } = params;
  const [tx, setTx] = useState<TxState>(TX_IDLE);

  const ready = useMemo(() => !!provider && !!account && !!usd8 && !!lending, [provider, account, usd8, lending]);

  const approveIfNeeded = useCallback(
    async (amount: bigint) => {
      if (!usd8 || !account) throw new Error("Wallet not connected");
      const allowance = (await usd8.allowance(account, deployments.simpleLendingAddress)) as bigint;
      if (allowance >= amount) return;
      const signer = await params.provider!.getSigner();
      const token = getWriteToken(usd8, signer);
      await runTx(
        "Approve USD8",
        () => token.approve(deployments.simpleLendingAddress, amount),
        setTx,
      );
    },
    [account, usd8, params.provider],
  );

  const supply = useCallback(
    async (amountStr: string) => {
      if (!ready) throw new Error("Wallet not connected");
      const amount = parseAmount(amountStr, decimals);
      await approveIfNeeded(amount);
      const signer = await provider!.getSigner();
      const write = getWriteLending(lending!, signer);
      const receipt = await runTx("Supply", () => write.supply(amount), setTx);
      if (receipt && onConfirmed) onConfirmed();
    },
    [approveIfNeeded, decimals, lending, onConfirmed, provider, ready],
  );

  const withdraw = useCallback(
    async (amountStr: string) => {
      if (!ready) throw new Error("Wallet not connected");
      const amount = parseAmount(amountStr, decimals);
      const signer = await provider!.getSigner();
      const write = getWriteLending(lending!, signer);
      const receipt = await runTx("Withdraw", () => write.withdraw(amount), setTx);
      if (receipt && onConfirmed) onConfirmed();
    },
    [decimals, lending, onConfirmed, provider, ready],
  );

  const borrow = useCallback(
    async (amountStr: string) => {
      if (!ready) throw new Error("Wallet not connected");
      const amount = parseAmount(amountStr, decimals);
      const signer = await provider!.getSigner();
      const write = getWriteLending(lending!, signer);
      const receipt = await runTx("Borrow", () => write.borrow(amount), setTx);
      if (receipt && onConfirmed) onConfirmed();
    },
    [decimals, lending, onConfirmed, provider, ready],
  );

  const repay = useCallback(
    async (amountStr: string) => {
      if (!ready) throw new Error("Wallet not connected");
      const amount = parseAmount(amountStr, decimals);
      await approveIfNeeded(amount);
      const signer = await provider!.getSigner();
      const write = getWriteLending(lending!, signer);
      const receipt = await runTx("Repay", () => write.repay(amount), setTx);
      if (receipt && onConfirmed) onConfirmed();
    },
    [approveIfNeeded, decimals, lending, onConfirmed, provider, ready],
  );

  return { tx, setTx, supply, withdraw, borrow, repay, ready };
}

