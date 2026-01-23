export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function healthFactorColor(healthFactor: bigint): string {
  // Contract uses healthFactor = (maxBorrowable * 100) / borrowed
  // 100 = borderline; > 120 healthy-ish; < 100 risky
  if (healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
    return "#0ea5e9"; // infinite (no borrow)
  }
  if (healthFactor < 100n) return "#ef4444";
  if (healthFactor < 120n) return "#f59e0b";
  return "#22c55e";
}
