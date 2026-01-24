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

export function normalizeError(err: unknown): AppError {
  if (err && typeof err === "object") {
    const e = err as {
      shortMessage?: unknown;
      reason?: unknown;
      message?: unknown;
      code?: unknown;
      error?: { message?: unknown };
    };
    const message: string =
      (typeof e.shortMessage === "string" ? e.shortMessage : undefined) ??
      (typeof e.reason === "string" ? e.reason : undefined) ??
      (typeof e.message === "string" ? e.message : undefined) ??
      (typeof e.error?.message === "string" ? e.error.message : undefined) ??
      "Unknown error";
    const code = e.code as string | number | undefined;
    return { message, code, kind: classifyErrorKind({ message, code, err }) };
  }
  const message = typeof err === "string" ? err : "Unknown error";
  return { message, kind: classifyErrorKind({ message, code: undefined, err }) };
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
  if (/insufficient funds/i.test(message)) return "InsufficientBalance";
  if (/insufficient allowance/i.test(message)) return "InsufficientAllowance";

  // App-side validation errors
  if (err && typeof err === "object" && (err as { name?: unknown }).name === "ValidationError") return "Validation";

  // Generic RPC/network issues
  if (/network|timeout|failed to fetch|connection|disconnect|ECONN/i.test(message)) return "Rpc";

  return "Unknown";
}
