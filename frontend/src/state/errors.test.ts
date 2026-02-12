import { describe, expect, it } from "vitest";
import { isUserRejected, normalizeError } from "./errors";

describe("normalizeError", () => {
  it("rewrites wrong-network and keeps rawMessage", () => {
    const e = new Error("Wrong network: expected 31337, got 1");
    const n = normalizeError(e);
    expect(n.kind).toBe("NetworkMismatch");
    expect(n.message).toContain("Expected chainId 31337");
    expect(n.meta?.rawMessage).toBe("Wrong network: expected 31337, got 1");
  });

  it("classifies user rejected", () => {
    const n = normalizeError({ code: 4001, message: "User rejected" });
    expect(n.kind).toBe("UserRejected");
    expect(isUserRejected({ code: 4001, message: "User rejected" })).toBe(true);
  });

  it("rewrites common revert reasons", () => {
    const n = normalizeError(new Error("Exceeds borrowing limit"));
    expect(n.kind).toBe("Revert");
    expect(n.message).toBe("Exceeds borrowing limit.");
    expect(n.meta?.rawMessage).toBe("Exceeds borrowing limit");
  });
});
