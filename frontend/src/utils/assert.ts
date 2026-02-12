/** Throws with a clear message if value is null/undefined so callers can rely on a defined value after this. */
export function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}
