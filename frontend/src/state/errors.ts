export type AppError = {
  message: string;
  code?: string | number;
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
    return { message, code };
  }
  return { message: typeof err === "string" ? err : "Unknown error" };
}

export function isUserRejected(err: unknown): boolean {
  const { code, message } = normalizeError(err);
  return code === 4001 || /user rejected|denied|rejected/i.test(message);
}
