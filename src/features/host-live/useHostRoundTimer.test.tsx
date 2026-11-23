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
    setNotice: vi.fn(),
    setError: vi.fn(),
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
it("selects preparation for the upcoming scheduled task instead of an earlier task", () => {
  const base = options();
  const props = {
    ...base,
    mainRounds: [
      hostChallengeFixture({ title: "First" }),
      hostChallengeFixture({
        id: "next",
        round_number: 2,
        title: "Portrait — Player prep",
      }),
    ],
    plannedTasks: [
      { id: "first-task", title: "First", equipment: ["Wrong"] },
      { id: "portrait-task", title: "Portrait", equipment: ["Camera"] },
    ],
    gameSchedule: [
      { type: "challenge", title: "First", duration: 5, taskId: "first-task" },
      {
        type: "challenge",
        title: "Portrait — Player prep",
        duration: 5,
        taskId: "portrait-task",
      },
    ],
  };
  const { result, rerender } = renderHook(
    ({ plannedTasks, gameSchedule }) =>
      useHostRoundTimer({ ...props, plannedTasks, gameSchedule }),
    {
      initialProps: {
        plannedTasks: props.plannedTasks,
        gameSchedule: props.gameSchedule,
      },
    },
  );
  expect(result.current.nextBreakTask?.equipment).toEqual(["Camera"]);
  rerender({
    plannedTasks: [props.plannedTasks[0]],
    gameSchedule: props.gameSchedule,
  });
  expect(result.current.nextBreakTask).toBeUndefined();
});
it("ticks once per second, publishes every five seconds and clears intervals on unmount", async () => {
  const props = options();
  const { result, unmount } = renderHook(() => useHostRoundTimer(props));
  await act(async () => {});
  act(() => result.current.toggleTimer());
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

it.each([{}, "2", 2.5, 0, -1, null])(
  "resets a corrupted saved break target %j before publishing or advancing",
  async (resumeRound) => {
    localStorage.setItem(
      "chaos-crawl-host-round-clock:session:1",
      JSON.stringify({
        seconds: 0,
        running: true,
        onBreak: true,
        resumeRound,
        updatedAt: Date.now(),
      }),
    );
    const props = options();
    const { result } = renderHook(() => useHostRoundTimer(props));
    await act(async () => {});
    expect(result.current.hostBreakActive).toBe(false);
    expect(result.current.roundClockSeconds).toBe(300);
    expect(write.mock.calls[0]?.[0]).toMatchObject({
      remaining_seconds: 300,
      is_running: false,
      is_on_break: false,
      resume_round_number: null,
    });
  },
);
it("preserves a valid future break target even before its challenge is loaded", async () => {
  localStorage.setItem(
    "chaos-crawl-host-round-clock:session:1",
    JSON.stringify({
      seconds: 90,
      running: false,
      onBreak: true,
      resumeRound: 9,
      updatedAt: Date.now(),
    }),
  );
  const { result } = renderHook(() => useHostRoundTimer(options()));
  await act(async () => {});
  expect(result.current.breakResumeRound).toBe(9);
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    remaining_seconds: 90,
    is_on_break: true,
    resume_round_number: 9,
  });
});
it("keeps pause, reset-paused and restart-running as distinct operations", async () => {
  const { result } = renderHook(() => useHostRoundTimer(options()));
  await act(async () => {});
  act(() => result.current.toggleTimer());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  act(() => result.current.toggleTimer());
  expect(result.current.roundClockRunning).toBe(false);
  expect(result.current.roundClockSeconds).toBe(298);
  act(() => result.current.resetRoundTimer());
  expect(result.current.roundClockSeconds).toBe(300);
  expect(result.current.roundClockRunning).toBe(false);
  act(() => result.current.restartRoundTimer());
  expect(result.current.roundClockSeconds).toBe(300);
  expect(result.current.roundClockRunning).toBe(true);
});
it("edits and adds time using the existing clock and shared publication queue", async () => {
  const { result } = renderHook(() => useHostRoundTimer(options()));
  await act(async () => {});
  act(() => result.current.setRoundTimerSeconds(120));
  expect(result.current.roundClockSeconds).toBe(120);
  expect(result.current.roundClockRunning).toBe(false);
  act(() => result.current.toggleTimer());
  act(() => {
    result.current.addRoundTimerMinutes(1);
    result.current.addRoundTimerMinutes(5);
  });
  expect(result.current.roundClockSeconds).toBe(480);
  expect(result.current.roundClockRunning).toBe(true);
  await act(async () => {});
  expect(write.mock.calls.at(-1)?.[0]).toMatchObject({
    remaining_seconds: 480,
    is_running: true,
    is_on_break: false,
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(result.current.roundClockSeconds).toBe(479);
  act(() => result.current.toggleTimer());
  expect(result.current.roundClockSeconds).toBe(479);
  expect(result.current.roundClockRunning).toBe(false);
});
it("does not apply round timer adjustments during a break", async () => {
  const { result } = renderHook(() => useHostRoundTimer(options()));
  await act(async () => {});
  await act(async () => result.current.startScheduledBreak(2, 2));
  act(() => result.current.addRoundTimerMinutes(5));
  expect(result.current.roundClockSeconds).toBe(120);
  expect(result.current.hostBreakActive).toBe(true);
});
it("reports storage failure while still publishing a changed timer", async () => {
  const props = options();
  const { result } = renderHook(() => useHostRoundTimer(props));
  await act(async () => {});
  const storage = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("storage unavailable");
    });
  act(() => result.current.addRoundTimerMinutes(1));
  await act(async () => {});
  expect(props.setError).toHaveBeenCalledWith(
    "The round timer changed, but this browser could not save it for recovery.",
  );
  expect(write.mock.calls.at(-1)?.[0]).toMatchObject({
    remaining_seconds: 360,
    is_running: false,
  });
  storage.mockRestore();
});
it("writes a scheduled break locally before the shared publish settles", async () => {
  const { result } = renderHook(() => useHostRoundTimer(options()));
  await act(async () => {});
  let resolve: (value: ApiResult<unknown>) => void = () => {};
  write.mockImplementationOnce(
    () =>
      new Promise<ApiResult<unknown>>((done) => {
        resolve = done;
      }),
  );
  let pending = Promise.resolve();
  act(() => {
    pending = result.current.startScheduledBreak(2, 2);
  });
  expect(
    JSON.parse(
      localStorage.getItem("chaos-crawl-host-round-clock:session:1") ?? "null",
    ),
  ).toMatchObject({
    seconds: 120,
    running: true,
    onBreak: true,
    resumeRound: 2,
  });
  await act(async () => {});
  await act(async () => {
    resolve({ data: null, error: null });
    await pending;
  });
});
