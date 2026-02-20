import { describe, expect, it, vi, beforeEach } from "vitest";
import { runTxDetailed } from "./tx";

vi.mock("./sessionEvidence", () => ({ append: vi.fn() }));

vi.mock("../config/runtime", () => ({
  TX_CONFIRMATIONS: 1,
  TX_PENDING_TIMEOUT_MS: 10,
  TX_DROPPED_POLL_ATTEMPTS: 3,
  TX_DROPPED_POLL_DELAY_MS: 0,
  POST_STATE_MAX_WAIT_MS: 100,
}));

describe("runTxDetailed", () => {
  let setTxMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setTxMock = vi.fn();
  });

  it("sets outcome dropped and error message on TX_TIMEOUT", async () => {
    const send = vi.fn().mockResolvedValue({
      hash: "0xabc",
      wait: vi.fn().mockImplementation(() =>
        Promise.reject(new Error("TX_TIMEOUT"))
      ),
    });

    await runTxDetailed("Supply", send, setTxMock as (next: import("./tx").TxState) => void);

    expect(send).toHaveBeenCalled();
    const lastCall = setTxMock.mock.calls[setTxMock.mock.calls.length - 1][0] as import("./tx").TxState;
    expect(lastCall.stage).toBe("stuck");
    expect(lastCall.outcome).toBe("dropped");
    expect(lastCall.hash).toBe("0xabc");
    expect(lastCall.error?.message).toContain("dropped");
    expect(lastCall.error?.message).toMatch(/gas|resend/i);
  });

  it("sets outcome replaced and replacementHash on TRANSACTION_REPLACED (cancelled)", async () => {
    const replacementHash = "0xreplaced123";
    const send = vi.fn().mockResolvedValue({
      hash: "0xoriginal",
      wait: vi.fn().mockRejectedValue({
        code: "TRANSACTION_REPLACED",
        cancelled: true,
        replacement: { hash: replacementHash },
        reason: "cancelled",
      }),
    });

    await runTxDetailed("Borrow", send, setTxMock as (next: import("./tx").TxState) => void);

    expect(send).toHaveBeenCalled();
    const failedCall = setTxMock.mock.calls.find(
      (c: unknown[]) => (c[0] as import("./tx").TxState).outcome === "replaced" && (c[0] as import("./tx").TxState).stage === "failed"
    );
    expect(failedCall).toBeDefined();
    expect((failedCall![0] as import("./tx").TxState).replacementHash).toBe(replacementHash);
    expect((failedCall![0] as import("./tx").TxState).hash).toBe("0xoriginal");
  });

  it("confirms successfully when wait resolves with receipt", async () => {
    const receipt = { blockNumber: 42, gasUsed: 21000n };
    const send = vi.fn().mockResolvedValue({
      hash: "0xok",
      wait: vi.fn().mockResolvedValue(receipt),
    });

    const result = await runTxDetailed("Supply", send, setTxMock as (next: import("./tx").TxState) => void);

    expect(result.receipt).toEqual(receipt);
    expect(result.hash).toBe("0xok");
    const confirmedCall = setTxMock.mock.calls.find((c: unknown[]) => (c[0] as import("./tx").TxState).stage === "confirmed");
    expect(confirmedCall).toBeDefined();
    expect((confirmedCall![0] as import("./tx").TxState).outcome).toBe("confirmed");
  });

  it("sets droppedReason rpcDegraded when TX_TIMEOUT and provider.getTransaction throws", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue({
      hash: "0xabc",
      wait: vi.fn().mockImplementation(() => new Promise<never>(() => {})),
    });
    const provider = {
      getTransaction: vi.fn().mockRejectedValue(new Error("network error")),
    } as unknown as import("ethers").Provider;

    const runPromise = runTxDetailed(
      "Borrow",
      send,
      setTxMock as (next: import("./tx").TxState) => void,
      { provider }
    );
    await vi.advanceTimersByTimeAsync(50);
    await runPromise;

    const droppedCall = setTxMock.mock.calls.find(
      (c: unknown[]) => (c[0] as import("./tx").TxState).outcome === "dropped" && (c[0] as import("./tx").TxState).droppedReason === "rpcDegraded"
    );
    expect(droppedCall).toBeDefined();
    expect((droppedCall![0] as import("./tx").TxState).droppedReason).toBe("rpcDegraded");
    vi.useRealTimers();
  });
});
