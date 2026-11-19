import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useClipboard } from "./useClipboard";
const write = vi.fn<(text: string) => Promise<void>>();
function deferred() {
  let resolve = () => {};
  let reject = (error: Error) => {
    void error;
  };
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.useFakeTimers();
  write.mockReset().mockResolvedValue();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: write },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("copies the supplied text and leaves persistent feedback without a reset duration", async () => {
  const { result } = renderHook(() => useClipboard({ text: "123456" }), {
    wrapper: StrictMode,
  });
  await act(async () => {
    expect(await result.current.copy()).toBe("copied");
  });
  expect(write).toHaveBeenCalledWith("123456");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(result.current.copied).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
it("returns current clipboard failures without scheduling feedback", async () => {
  write.mockRejectedValueOnce(new Error("Denied"));
  const { result } = renderHook(() =>
    useClipboard({ text: "123456", resetAfterMs: 1800 }),
  );
  await act(async () => {
    expect(await result.current.copy()).toBe("failed");
  });
  expect(result.current.copied).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});
it("gives each successful copy its full reset window", async () => {
  const { result } = renderHook(() =>
    useClipboard({ text: "123456", resetAfterMs: 1800 }),
  );
  await act(async () => {
    await result.current.copy();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
    await result.current.copy();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(900);
  });
  expect(result.current.copied).toBe(true);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(901);
  });
  expect(result.current.copied).toBe(false);
});
it("does not create a reset timer for a completion after unmount", async () => {
  const pending = deferred();
  write.mockReturnValueOnce(pending.promise);
  const { result, unmount } = renderHook(() =>
    useClipboard({ text: "123456", resetAfterMs: 1800 }),
  );
  const operation = result.current.copy();
  unmount();
  pending.resolve();
  expect(await operation).toBe("obsolete");
  expect(vi.getTimerCount()).toBe(0);
});
it("clears an existing reset timer on unmount", async () => {
  const { result, unmount } = renderHook(() =>
    useClipboard({ text: "123456", resetAfterMs: 1800 }),
  );
  await act(async () => {
    await result.current.copy();
  });
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("rejects an old text completion even after switching away and back", async () => {
  const pending = deferred();
  write.mockReturnValueOnce(pending.promise);
  const { result, rerender } = renderHook(
    ({ text }) => useClipboard({ text, resetAfterMs: 1800 }),
    { initialProps: { text: "123456" } },
  );
  const operation = result.current.copy();
  rerender({ text: "654321" });
  rerender({ text: "123456" });
  await act(async () => {
    pending.resolve();
    expect(await operation).toBe("obsolete");
  });
  expect(result.current.copied).toBe(false);
  await act(async () => {
    expect(await result.current.copy()).toBe("copied");
  });
  expect(result.current.copied).toBe(true);
});
it("does not let an older rejection replace a newer successful copy", async () => {
  const pending = deferred();
  write.mockReturnValueOnce(pending.promise);
  const { result } = renderHook(() =>
    useClipboard({ text: "123456", resetAfterMs: 1800 }),
  );
  const old = result.current.copy();
  await act(async () => {
    await result.current.copy();
    pending.reject(new Error("Old denial"));
    expect(await old).toBe("obsolete");
  });
  expect(result.current.copied).toBe(true);
});
it("retains the old successful reset deadline when a subsequent copy fails", async () => {
  const { result } = renderHook(() =>
    useClipboard({ text: "123456", resetAfterMs: 1800 }),
  );
  await act(async () => {
    await result.current.copy();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  write.mockRejectedValueOnce(new Error("Denied"));
  await act(async () => {
    expect(await result.current.copy()).toBe("failed");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(801);
  });
  expect(result.current.copied).toBe(false);
});
