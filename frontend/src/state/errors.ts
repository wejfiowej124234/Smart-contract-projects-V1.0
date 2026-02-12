import {
  errorWrongNetworkExpectedGotTemplate,
  errorExceedsBorrowingLimit,
  errorWithdrawalUnhealthy,
  errorInsufficientPoolLiquidity,
  errorInsufficientSuppliedAmount,
  errorRepayExceedsBorrowed,
  errorAmountMustBeGreaterThanZero,
  errorInsufficientAllowanceApproveFirst,
  errorInsufficientTokenBalance,
  errorDashboardContractReadFailed,
  errorRpcNetworkCheckNode,
  unknownErrorFallback,
} from "../config/ui";

export type AppError = {
  kind?:
    | "UserRejected"
    | "NetworkMismatch"
    | "Revert"
    | "Rpc"
    | "InsufficientBalance"
    | "InsufficientAllowance"
    | "Validation"
    | "Unknown";
  message: string;
  code?: string | number;
  meta?: Record<string, unknown>;
};

function rewriteMessage(raw: string): { message: string; meta?: Record<string, unknown> } {
  const m = raw.trim();

  // Wallet/network
  {
    const mm = /Wrong network: expected\s+(\d+)\s*,\s*got\s+(\d+)/i.exec(m);
    if (mm) {
      const message = errorWrongNetworkExpectedGotTemplate.replace("{expected}", mm[1]).replace("{got}", mm[2]);
      return {
        message,
        meta: { rawMessage: m, expectedChainId: Number(mm[1]), gotChainId: Number(mm[2]) },
      };
    }
  }

  // Contract reverts (assignment-specific wording)
  if (/exceeds borrowing limit/i.test(m)) return { message: errorExceedsBorrowingLimit, meta: { rawMessage: m } };
  if (/withdrawal would make position unhealthy/i.test(m))
    return { message: errorWithdrawalUnhealthy, meta: { rawMessage: m } };
  if (/insufficient liquidity/i.test(m)) return { message: errorInsufficientPoolLiquidity, meta: { rawMessage: m } };
  if (/insufficient supply/i.test(m)) return { message: errorInsufficientSuppliedAmount, meta: { rawMessage: m } };
  if (/amount exceeds borrow/i.test(m)) return { message: errorRepayExceedsBorrowed, meta: { rawMessage: m } };
  if (/amount must be greater than 0/i.test(m)) return { message: errorAmountMustBeGreaterThanZero, meta: { rawMessage: m } };

  // Token-level patterns
  if (/insufficient allowance/i.test(m))
    return { message: errorInsufficientAllowanceApproveFirst, meta: { rawMessage: m } };
  if (/insufficient balance/i.test(m) || /ERC20: transfer amount exceeds balance/i.test(m))
    return { message: errorInsufficientTokenBalance, meta: { rawMessage: m } };

  // We replace noisy RPC messages (e.g. "missing revert data") with a clearer message so the user sees a consistent error. Regex includes localized ethers message.
  if (/missing revert data|缺少还原数据/i.test(m))
    return { message: errorDashboardContractReadFailed, meta: { rawMessage: m } };
  if (/failed to fetch|network error|socket hang up|ECONNRESET|ECONNREFUSED/i.test(m))
    return { message: errorRpcNetworkCheckNode, meta: { rawMessage: m } };

  return { message: m };
}

export function normalizeError(err: unknown): AppError {
  if (err && typeof err === "object") {
    const e = err as {
      shortMessage?: unknown;
      reason?: unknown;
      message?: unknown;
      code?: unknown;
      error?: { message?: unknown };
    };
    const rawMessage: string =
      (typeof e.shortMessage === "string" ? e.shortMessage : undefined) ??
      (typeof e.reason === "string" ? e.reason : undefined) ??
      (typeof e.message === "string" ? e.message : undefined) ??
      (typeof e.error?.message === "string" ? e.error.message : undefined) ??
      unknownErrorFallback;
    const code = e.code as string | number | undefined;
    const rewritten = rewriteMessage(rawMessage);
    const kind = classifyErrorKind({ message: rewritten.message, code, err });
    return {
      message: rewritten.message,
      code,
      kind,
      meta: rewritten.meta,
    };
  }
  const rawMessage = typeof err === "string" ? err : unknownErrorFallback;
  const rewritten = rewriteMessage(rawMessage);
  return {
    message: rewritten.message,
    kind: classifyErrorKind({ message: rewritten.message, code: undefined, err }),
    meta: rewritten.meta,
  };
}

export function isUserRejected(err: unknown): boolean {
  const { code, message } = normalizeError(err);
  return code === 4001 || /user rejected|denied|rejected/i.test(message);
}

function classifyErrorKind(args: { message: string; code?: string | number; err: unknown }): AppError["kind"] {
  const { message, code, err } = args;

  if (code === 4001 || /user rejected|denied|rejected/i.test(message)) return "UserRejected";
  if (/wrong network/i.test(message)) return "NetworkMismatch";

  // Common ethers patterns
  if (code === "CALL_EXCEPTION" || /execution reverted|revert(ed)?/i.test(message)) return "Revert";

  // Assignment-specific reverts (rewritten to be user-friendly, without the word "revert").
  if (
    /exceeds borrowing limit|withdrawal would make the position unhealthy|insufficient pool liquidity|insufficient supplied amount|repay amount exceeds borrowed amount/i.test(
      message,
    )
  )
    return "Revert";
  if (/insufficient funds/i.test(message)) return "InsufficientBalance";
  if (/insufficient allowance/i.test(message)) return "InsufficientAllowance";

  // App-side validation errors
  if (err && typeof err === "object" && (err as { name?: unknown }).name === "ValidationError") return "Validation";

  // Generic RPC/network issues
  if (/network|timeout|failed to fetch|connection|disconnect|ECONN/i.test(message)) return "Rpc";

  return "Unknown";
}
