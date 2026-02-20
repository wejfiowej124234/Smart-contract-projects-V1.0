import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getRpcStatus, getHealthyRpcUrl } from "./rpcHealth";

vi.mock("./network", () => ({
  getRpcUrls: vi.fn((chainId: number) => {
    if (chainId === 31337) return ["http://127.0.0.1:8545"];
    if (chainId === 1) return ["https://primary.eth", "https://fallback.eth"];
    return [];
  }),
}));

describe("rpcHealth", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it("getRpcStatus returns initial state before any probe", () => {
    const status = getRpcStatus();
    expect(status).toHaveProperty("chainId");
    expect(status).toHaveProperty("status");
    expect(status).toHaveProperty("rpcFailCount");
    expect(status).toHaveProperty("rpcLastOkAt");
  });

  it("getHealthyRpcUrl returns null and sets unavailable when no URLs", async () => {
    const { getRpcUrls } = await import("./network");
    vi.mocked(getRpcUrls).mockReturnValueOnce([]);

    const url = await getHealthyRpcUrl(999);
    expect(url).toBeNull();
    const status = getRpcStatus();
    expect(status.status).toBe("unavailable");
    expect(status.chainId).toBe(999);
  });

  it("getHealthyRpcUrl sets ok and rpcLastOkAt when primary responds", async () => {
    globalThis.fetch = vi.fn((_input: RequestInfo | URL, opts?: RequestInit) => {
      const body = opts?.body ? JSON.parse(opts.body as string) : {};
      const result = body.method === "eth_chainId" ? "0x7a69" : body.method === "eth_blockNumber" ? "0x100" : undefined;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result }),
      } as Response);
    }) as typeof fetch;

    const url = await getHealthyRpcUrl(31337);
    expect(url).toBe("http://127.0.0.1:8545");
    const status = getRpcStatus();
    expect(status.status).toBe("ok");
    expect(status.url).toBe("http://127.0.0.1:8545");
    expect(status.rpcLastOkAt).toBeDefined();
  });

  it("getHealthyRpcUrl increments rpcFailCount and uses fallback when primary fails", async () => {
    const { getRpcUrls } = await import("./network");
    vi.mocked(getRpcUrls).mockReturnValue(["https://primary.eth", "https://fallback.eth"]);

    let callCount = 0;
    globalThis.fetch = vi.fn((_input: RequestInfo | URL, opts?: RequestInit) => {
      callCount++;
      if (callCount <= 2) return Promise.reject(new Error("network error"));
      const body = opts?.body ? JSON.parse(opts.body as string) : {};
      const result = body.method === "eth_chainId" ? "0x1" : body.method === "eth_blockNumber" ? "0x200" : undefined;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result }),
      } as Response);
    }) as typeof fetch;

    const url = await getHealthyRpcUrl(1);
    expect(url).toBe("https://fallback.eth");
    const status = getRpcStatus();
    expect(status.status).toBe("fallback");
    expect(status.url).toBe("https://fallback.eth");
    expect(status.rpcFailCount).toBeGreaterThanOrEqual(1);
    expect(status.rpcLastOkAt).toBeDefined();
  });

  it("getHealthyRpcUrl sets unavailable and cumulative fail count when all URLs fail", async () => {
    const { getRpcUrls } = await import("./network");
    vi.mocked(getRpcUrls).mockReturnValue(["https://a.eth", "https://b.eth"]);
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("fail"))) as typeof fetch;

    const url = await getHealthyRpcUrl(1);
    expect(url).toBeNull();
    const status = getRpcStatus();
    expect(status.status).toBe("unavailable");
    expect(status.rpcFailCount).toBeGreaterThanOrEqual(2);
  });

  it("getHealthyRpcUrl stores blockNumber and blockDrift when primary responds (primary still usable)", async () => {
    const { getRpcUrls } = await import("./network");
    vi.mocked(getRpcUrls).mockReturnValue(["http://127.0.0.1:8545"]);
    globalThis.fetch = vi.fn((_input: RequestInfo | URL, opts?: RequestInit) => {
      const body = opts?.body ? JSON.parse(opts.body as string) : {};
      const result = body.method === "eth_chainId" ? "0x7a69" : body.method === "eth_blockNumber" ? "0x64" : undefined;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result }),
      } as Response);
    }) as typeof fetch;

    const url = await getHealthyRpcUrl(31337);
    expect(url).toBe("http://127.0.0.1:8545");
    const status = getRpcStatus();
    expect(status.status).toBe("ok");
    expect(status.blockNumber).toBe(0x64);
    expect(status.blockDrift).toBe(0);
  });

  it("getHealthyRpcUrl uses fallback and sets blockNumber when primary fails (fallback branch)", async () => {
    const { getRpcUrls } = await import("./network");
    vi.mocked(getRpcUrls).mockReturnValue(["https://primary.eth", "https://fallback.eth"]);

    let callCount = 0;
    globalThis.fetch = vi.fn((_input: RequestInfo | URL, opts?: RequestInit) => {
      callCount++;
      if (callCount <= 2) return Promise.reject(new Error("network error"));
      const body = opts?.body ? JSON.parse(opts.body as string) : {};
      const result = body.method === "eth_chainId" ? "0x1" : body.method === "eth_blockNumber" ? "0x200" : undefined;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result }),
      } as Response);
    }) as typeof fetch;

    const url = await getHealthyRpcUrl(1);
    expect(url).toBe("https://fallback.eth");
    const status = getRpcStatus();
    expect(status.status).toBe("fallback");
    expect(status.blockNumber).toBe(0x200);
    expect(status.blockDrift).toBe(0);
  });
});
