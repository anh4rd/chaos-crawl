import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useSessionTimer } from "./useSessionTimer";
import type { SharedGameTimer } from "./types";

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  onChange: null as (() => void) | null,
  remove: vi.fn(),
}));
vi.mock("../../lib/sessionSupabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }),
    }),
    channel: () => {
      const channel = {
        on: (_event: string, _filter: unknown, changed: () => void) => {
          mocks.onChange = changed;
          return channel;
        },
        subscribe: () => channel,
      };
      return channel;
    },
    removeChannel: mocks.remove,
  },
}));
const snapshot: SharedGameTimer = {
  session_id: "session",
  round_number: 1,
  remaining_seconds: 120,
  is_running: true,
  is_on_break: false,
  resume_round_number: null,
  break_ends_at: null,
  updated_at: "2026-11-17T12:00:00Z",
};
beforeEach(() => {
  vi.useFakeTimers();
  mocks.read.mockReset().mockResolvedValue({ data: snapshot, error: null });
  mocks.remove.mockReset();
  mocks.onChange = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("does not restart elapsed time when polling returns the same snapshot", async () => {
  const { result } = renderHook(() =>
    useSessionTimer("session", "live", "game"),
  );
  await act(async () => {});
  const received = result.current.timerReceivedAt;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(4000);
  });
  expect(result.current.sharedTimer).toEqual(snapshot);
  expect(result.current.timerReceivedAt).toBe(received);
  expect(result.current.timerNow).toBeGreaterThanOrEqual(received ?? 0);
});

it("ignores older responses after a newer Realtime refresh and unsubscribes on navigation", async () => {
  let resolveFirst: (value: {
    data: SharedGameTimer;
    error: null;
  }) => void = () => {};
  mocks.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
  );
  const { result, rerender } = renderHook(
    ({ page }) => useSessionTimer("session", "live", page),
    { initialProps: { page: "game" as "game" | "leaderboard" } },
  );
  const newer = {
    ...snapshot,
    remaining_seconds: 60,
    updated_at: "2026-11-17T12:01:00Z",
  };
  mocks.read.mockResolvedValue({ data: newer, error: null });
  await act(async () => {
    mocks.onChange?.();
  });
  await act(async () => {
    resolveFirst({ data: snapshot, error: null });
  });
  expect(result.current.sharedTimer).toEqual(newer);
  rerender({ page: "leaderboard" });
  expect(result.current.sharedTimer).toBeNull();
  expect(mocks.remove).toHaveBeenCalledOnce();
  const calls = mocks.read.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(4000);
  });
  expect(mocks.read).toHaveBeenCalledTimes(calls);
});

it("retains the last timer on a refresh failure and clears the error after recovery", async () => {
  const { result } = renderHook(() =>
    useSessionTimer("session", "live", "game"),
  );
  await act(async () => {});
  mocks.read.mockResolvedValueOnce({
    data: null,
    error: { message: "offline" },
  });
  await act(async () => {
    mocks.onChange?.();
  });
  expect(result.current.sharedTimer).toEqual(snapshot);
  expect(result.current.sharedTimerError).toContain(
    "shared timer is unavailable",
  );
  await act(async () => {
    mocks.onChange?.();
  });
  expect(result.current.sharedTimerError).toBe("");
});
