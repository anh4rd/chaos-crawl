vi.mock("../../lib/monitoring", () => ({ reportError: vi.fn() }));
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hostSessionFixture } from "./testFixtures";
import { useHostSessionData } from "./useHostSessionData";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), read: vi.fn() }));
vi.mock("../../lib/sessionSupabase", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: (table: string) => {
      let id = "";
      const query = {
        select: (_fields: string) => query,
        eq: (_field: string, value: string) => {
          id = value;
          return query;
        },
        order: () => query,
        single: () => query,
        maybeSingle: () => query,
        then: (
          ...args: Parameters<
            Promise<{ data: unknown; error: unknown }>["then"]
          >
        ) => mocks.read(table, id).then(...args),
      };
      return query;
    },
  },
}));
beforeEach(() => {
  mocks.rpc.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.read
    .mockReset()
    .mockImplementation(async (table: string, id: string) => ({
      data: table === "cc_game_sessions" ? hostSessionFixture({ id }) : [],
      error: null,
    }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("rejects obsolete session reads after the session ID changes", async () => {
  let finish: (value: unknown) => void = () => {};
  mocks.read.mockImplementation((table: string, id: string) =>
    id === "old" && table === "cc_game_sessions"
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : Promise.resolve({
          data: table === "cc_game_sessions" ? hostSessionFixture({ id }) : [],
          error: null,
        }),
  );
  const { result, rerender } = renderHook(({ id }) => useHostSessionData(id), {
    initialProps: { id: "old" },
  });
  await waitFor(() =>
    expect(mocks.read).toHaveBeenCalledWith("cc_game_sessions", "old"),
  );
  rerender({ id: "new" });
  await waitFor(() => expect(result.current.session?.id).toBe("new"));
  await act(async () => {
    finish({ data: hostSessionFixture({ id: "old" }), error: null });
  });
  expect(result.current.session?.id).toBe("new");
});
it("stops polling and does not start queries after a late dispatch response on unmount", async () => {
  vi.useFakeTimers();
  let finish: (value: unknown) => void = () => {};
  mocks.rpc.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { unmount } = renderHook(() => useHostSessionData("session"));
  unmount();
  await act(async () => {
    finish({ data: null, error: null });
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(mocks.rpc).toHaveBeenCalledOnce();
  expect(mocks.read).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it("settles an initial rejected read and recovers through the existing reload", async () => {
  mocks.read.mockRejectedValueOnce(new Error("Network lost"));
  const { result } = renderHook(() => useHostSessionData("session"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toContain("Network lost");
  await act(async () => {
    await result.current.load();
  });
  expect(result.current.session?.id).toBe("session");
  expect(result.current.error).toBe("");
});
it("ignores a stale rejection after changing session and leaves current data intact", async () => {
  let reject: (reason: Error) => void = () => {};
  mocks.read.mockImplementation((table: string, id: string) =>
    id === "old" && table === "cc_game_sessions"
      ? new Promise((_resolve, fail) => {
          reject = fail;
        })
      : Promise.resolve({
          data: table === "cc_game_sessions" ? hostSessionFixture({ id }) : [],
          error: null,
        }),
  );
  const { result, rerender } = renderHook(({ id }) => useHostSessionData(id), {
    initialProps: { id: "old" },
  });
  await waitFor(() =>
    expect(mocks.read).toHaveBeenCalledWith("cc_game_sessions", "old"),
  );
  rerender({ id: "new" });
  await waitFor(() => expect(result.current.session?.id).toBe("new"));
  await act(async () => {
    reject(new Error("Obsolete failure"));
  });
  expect(result.current.error).toBe("");
  expect(result.current.session?.id).toBe("new");
});
it("retains a loaded snapshot through failed refresh and allows another refresh", async () => {
  const { result } = renderHook(() => useHostSessionData("session"));
  await waitFor(() => expect(result.current.session?.id).toBe("session"));
  mocks.read.mockRejectedValueOnce(new Error("Refresh offline"));
  await act(async () => {
    await result.current.load();
  });
  expect(result.current.session?.id).toBe("session");
  expect(result.current.error).toContain("Refresh offline");
  await act(async () => {
    await result.current.load();
  });
  expect(result.current.error).toBe("");
});
