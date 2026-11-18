import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ApiResult } from "../../lib/apiResult";
import { hostChallengeFixture, hostSessionFixture } from "./testFixtures";
import { useHostRoundTimer } from "./useHostRoundTimer";

const { write } = vi.hoisted(() => ({ write: vi.fn() }));
vi.mock("../../lib/hostSessionCommands", () => ({ writeSharedTimer: write }));
function options() {
  const current = hostChallengeFixture();
  return {
    mainRounds: [
      current,
      hostChallengeFixture({ id: "next", round_number: 2 }),
    ],
    session: hostSessionFixture(),
    plannedTasks: [],
    gameSchedule: [],
    defaultBreakMinutes: 0,
    currentChallenge: current,
    busy: false,
    moveToRound: vi.fn(async () => {}),
    startGame: vi.fn(async () => {}),
    setNotice: vi.fn(),
    setError: vi.fn(),
    autoplayEnabled: false,
    sessionId: "session",
    setBusy: vi.fn(() => true),
    openPointReview: vi.fn(),
  };
}
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  write.mockReset().mockResolvedValue({ data: null, error: null });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("ticks once per second, publishes every five seconds and clears intervals on unmount", async () => {
  const props = options();
  const { result, unmount } = renderHook(() => useHostRoundTimer(props));
  await act(async () => {});
  act(() => result.current.runStartRoundControl());
  for (let tick = 0; tick < 5; tick += 1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  expect(result.current.roundClockSeconds).toBe(295);
  expect(write.mock.calls.at(-1)?.[0]).toMatchObject({
    remaining_seconds: 296,
    is_running: true,
    is_on_break: false,
  });
  unmount();
  const count = write.mock.calls.length;
  await vi.advanceTimersByTimeAsync(10000);
  expect(write).toHaveBeenCalledTimes(count);
  expect(vi.getTimerCount()).toBe(0);
});
it("serializes snapshots and captures the original session before an identity change", async () => {
  const props = options();
  const { result, rerender } = renderHook(
    ({ session }) => useHostRoundTimer({ ...props, session }),
    { initialProps: { session: props.session } },
  );
  await act(async () => {});
  write.mockClear();
  let finish: (value: ApiResult<unknown>) => void = () => {};
  write.mockImplementationOnce(
    () =>
      new Promise<ApiResult<unknown>>((resolve) => {
        finish = resolve;
      }),
  );
  let first: Promise<boolean> = Promise.resolve(false);
  let second: Promise<boolean> = Promise.resolve(false);
  act(() => {
    first = result.current.saveSharedTimer(1, 90, true, false);
    second = result.current.saveSharedTimer(1, 80, false, false);
  });
  await act(async () => {});
  expect(write).toHaveBeenCalledTimes(1);
  rerender({ session: hostSessionFixture({ id: "other" }) });
  await act(async () => {
    finish({ data: null, error: null });
    await first;
    await second;
  });
  expect(
    write.mock.calls
      .slice(0, 2)
      .map(([value]) => [value.session_id, value.remaining_seconds]),
  ).toEqual([
    ["session", 90],
    ["session", 80],
  ]);
});
it("keeps the queue usable after a timer write error", async () => {
  const props = options();
  const { result } = renderHook(() => useHostRoundTimer(props));
  await act(async () => {});
  write.mockResolvedValueOnce({
    data: null,
    error: { message: "Timer denied" },
  });
  await act(async () => {
    expect(await result.current.saveSharedTimer(1, 10, false, false)).toBe(
      false,
    );
    expect(await result.current.saveSharedTimer(1, 9, false, false)).toBe(true);
  });
  expect(props.setError).toHaveBeenCalledWith(
    expect.stringContaining("Timer denied"),
  );
});
it("resumes a scheduled break only once when its timer expires", async () => {
  const props = options();
  const { result } = renderHook(() => useHostRoundTimer(props));
  await act(async () => {});
  await act(async () => {
    await result.current.startScheduledBreak(2, 1 / 60);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(props.moveToRound).toHaveBeenCalledTimes(1);
  expect(props.moveToRound).toHaveBeenCalledWith(2);
});
