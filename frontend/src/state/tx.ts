import type { TransactionReceipt, TransactionResponse } from "ethers";
import { normalizeError, type AppError } from "./errors";

export type TxStage = "idle" | "signing" | "pending" | "confirmed" | "failed";

export type TxState = {
  stage: TxStage;
  label?: string;
  hash?: string;
  error?: AppError;
};

export const TX_IDLE: TxState = { stage: "idle" };

export async function runTx(
  label: string,
  send: () => Promise<TransactionResponse>,
  setTx: (next: TxState) => void,
): Promise<TransactionReceipt | undefined> {
  setTx({ stage: "signing", label });
  try {
    const tx = await send();
    setTx({ stage: "pending", label, hash: tx.hash });
    const receipt = await tx.wait();
    setTx({ stage: "confirmed", label, hash: tx.hash });
    return receipt ?? undefined;
  } catch (e) {
    setTx({ stage: "failed", label, error: normalizeError(e) });
    return undefined;
  }
}
