import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GameState } from "../../types/database";
const mock = vi.hoisted(() => ({ reveal: vi.fn(), realtime: vi.fn() }));
vi.mock("../../lib/gameApi", () => ({ revealScheduledChallenge: mock.reveal }));
vi.mock("./useRealtimeQuery", () => ({ useRealtimeQuery: mock.realtime }));
import { useScheduledReveal } from "./useScheduledReveal";
import { useGameState } from "./useGameState";
const now = Date.parse("2026-11-16T12:00:00.000Z");
function game(delay: number, id = 8): GameState {
  return {
    id: 1,
    current_pub: "Pub",
    current_challenge: "Previous",
    challenge_description: "",
    current_challenge_id: 1,
    current_challenge_order: 1,
    voting_open: false,
    voting_target: "player",
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: id,
    scheduled_reveal_at: new Date(now + delay).toISOString(),
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.resetAllMocks();
  mock.reveal.mockResolvedValue({ data: null, error: null });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("waits until a future deadline and makes exactly one attempt", async () => {
  const scheduled = game(5000);
  renderHook(() => useScheduledReveal(scheduled));
  await act(async () => vi.advanceTimersByTimeAsync(4999));
  expect(mock.reveal).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(mock.reveal).toHaveBeenCalledWith(
    8,
    scheduled.scheduled_reveal_at,
    expect.any(AbortSignal),
  );
  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(mock.reveal).toHaveBeenCalledOnce();
});
it("reveals overdue schedules immediately", async () => {
  renderHook(() => useScheduledReveal(game(-1)));
  await act(async () => {});
  expect(mock.reveal).toHaveBeenCalledOnce();
});
it("reschedules changed deadlines and cancels removed schedules", async () => {
  const { rerender } = renderHook(({ value }) => useScheduledReveal(value), {
    initialProps: { value: game(1000) as GameState | null },
  });
  rerender({ value: game(3000, 9) });
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(mock.reveal).not.toHaveBeenCalled();
  rerender({ value: null });
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  expect(mock.reveal).not.toHaveBeenCalled();
});
it("ignores a stale fetch failure after the schedule is cancelled", async () => {
  let resolve!: (value: unknown) => void;
  mock.reveal.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { result, rerender } = renderHook(
    ({ value }) => useScheduledReveal(value),
    { initialProps: { value: game(-1) as GameState | null } },
  );
  const signal = mock.reveal.mock.calls[0][2] as AbortSignal;
  rerender({ value: null });
  expect(signal.aborted).toBe(true);
  await act(async () =>
    resolve({ data: null, error: { message: "Stale failure" } }),
  );
  expect(result.current.error).toBeNull();
});
it("bounds long timers without overflowing into an immediate reveal", async () => {
  renderHook(() => useScheduledReveal(game(2_147_483_647 + 1000)));
  await act(async () => vi.advanceTimersByTimeAsync(2_147_483_647));
  expect(mock.reveal).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(999));
  expect(mock.reveal).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(mock.reveal).toHaveBeenCalledOnce();
});
it("reports malformed schedules without attempting a write", () => {
  const { result } = renderHook(() =>
    useScheduledReveal({ ...game(1), scheduled_reveal_at: "invalid" }),
  );
  expect(result.current.error?.message).toContain("invalid");
  expect(mock.reveal).not.toHaveBeenCalled();
});
it("exposes failed attempts until explicitly retried, without retrying every snapshot", async () => {
  mock.reveal.mockResolvedValueOnce({
    data: null,
    error: { message: "Offline" },
  });
  const { result, rerender } = renderHook(
    ({ value }) => useScheduledReveal(value),
    { initialProps: { value: game(-1) } },
  );
  await act(async () => {});
  expect(result.current.error?.message).toContain("Offline");
  rerender({ value: { ...game(-1), current_pub: "Another pub" } });
  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(mock.reveal).toHaveBeenCalledOnce();
  await act(async () => result.current.retry());
  expect(mock.reveal).toHaveBeenCalledTimes(2);
  expect(result.current.error).toBeNull();
});
it("surfaces reveal errors through useGameState and retries with its refresh action", async () => {
  const reload = vi.fn(async () => {});
  mock.realtime.mockReturnValue({
    data: game(-1),
    error: null,
    loading: false,
    reload,
  });
  mock.reveal.mockResolvedValueOnce({
    data: null,
    error: { message: "Write denied" },
  });
  const { result } = renderHook(useGameState);
  await act(async () => {});
  expect(result.current.error?.message).toContain("Write denied");
  await act(async () => result.current.reload());
  expect(reload).toHaveBeenCalledOnce();
  expect(mock.reveal).toHaveBeenCalledTimes(2);
  expect(result.current.error).toBeNull();
});
