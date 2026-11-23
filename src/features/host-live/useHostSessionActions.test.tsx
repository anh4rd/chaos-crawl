import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hostChallengeFixture, hostSessionFixture } from "./testFixtures";
import type { SessionPlayer } from "./types";
import { useHostSessionActions } from "./useHostSessionActions";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  round: vi.fn(),
  finish: vi.fn(),
}));
vi.mock("../../lib/hostSessionCommands", () => ({
  hostStartGameSession: mocks.start,
  hostSetGameSessionRound: mocks.round,
  hostCompleteGameSession: mocks.finish,
}));
vi.mock("../../lib/hostRosterCommands", () => ({
  disableHostParticipation: vi.fn(async () => ({ data: null, error: null })),
}));
const player: SessionPlayer = {
  id: "player",
  name: "Pat",
  avatar_url: null,
  team_id: null,
  score: 0,
  joined_at: "2030-01-01",
  last_seen_at: "2030-01-01",
};
function options(): Parameters<typeof useHostSessionActions>[0] {
  return {
    autoplayEnabled: false,
    players: [player],
    session: hostSessionFixture(),
    teams: [],
    unassignedPlayers: [],
    setError: vi.fn(),
    setBusy: vi.fn(() => true),
    setNotice: vi.fn(),
    setSession: vi.fn(),
    sessionId: "session",
    mainRounds: [hostChallengeFixture()],
    initializeRoundClock: vi.fn(async () => {}),
    toggleTimer: vi.fn(),
    roundClockSeconds: 300,
    breakResumeRound: null,
    load: vi.fn(async () => {}),
    busy: false,
    activeRewardRound: null,
    hostBreakActive: false,
    plannedBreakAfter: vi.fn(() => 0),
    startScheduledBreak: vi.fn(async () => {}),
  };
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  for (const fn of Object.values(mocks))
    fn.mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);
it("rejects empty rosters and incomplete team assignments before starting", async () => {
  const props = options();
  props.players = [];
  const { result, rerender } = renderHook(
    ({ value }) => useHostSessionActions(value),
    { initialProps: { value: props } },
  );
  await act(async () => {
    await result.current.startGame();
  });
  expect(mocks.start).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenCalledWith(
    expect.stringContaining("At least one player"),
  );
  rerender({
    value: {
      ...props,
      players: [player],
      session: hostSessionFixture({ teams_enabled: true }),
      unassignedPlayers: [player],
    },
  });
  await act(async () => {
    await result.current.startGame();
  });
  expect(mocks.start).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenCalledWith(
    expect.stringContaining("Every player must be assigned"),
  );
});
it("initializes the first timer only after the start command succeeds", async () => {
  const props = options();
  props.session = hostSessionFixture({ status: "lobby" });
  const { result } = renderHook(() => useHostSessionActions(props));
  await act(async () => {
    await result.current.startGame();
  });
  expect(mocks.start).toHaveBeenCalledWith({ p_session_id: "session" });
  expect(props.initializeRoundClock).toHaveBeenCalledWith(1, 5);
  expect(
    vi.mocked(props.initializeRoundClock).mock.invocationCallOrder[0],
  ).toBeGreaterThan(mocks.start.mock.invocationCallOrder[0] ?? 0);
});
it("routes planned progression through a break and blocks round changes during rewards", async () => {
  const props = options();
  props.plannedBreakAfter = vi.fn(() => 2);
  const { result, rerender } = renderHook(
    ({ value }) => useHostSessionActions(value),
    { initialProps: { value: props } },
  );
  await act(async () => {
    await result.current.moveToRound(2);
  });
  expect(props.startScheduledBreak).toHaveBeenCalledWith(2, 2);
  expect(mocks.round).not.toHaveBeenCalled();
  rerender({
    value: {
      ...props,
      activeRewardRound: {
        id: "reward",
        session_id: "session",
        challenge_id: "challenge",
        reward_method: "voting",
        target_kind: "player",
        points: 20,
        status: "open",
        created_at: "2030-01-01",
        started_at: "2030-01-01",
        completed_at: null,
        released_at: null,
      },
    },
  });
  await act(async () => {
    await result.current.moveToRound(2);
  });
  expect(mocks.round).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenCalledWith(
    expect.stringContaining("Complete or cancel"),
  );
});
it("direct overrides skip planned breaks while retaining autoplay confirmation", async () => {
  const props = options();
  props.autoplayEnabled = true;
  props.plannedBreakAfter = vi.fn(() => 5);
  props.mainRounds.push(
    hostChallengeFixture({
      id: "second",
      round_number: 2,
      duration_minutes: 7,
    }),
  );
  const { result } = renderHook(() => useHostSessionActions(props));
  act(() => result.current.requestMoveToRound(2, true));
  expect(result.current.overridePrompt).toEqual({
    kind: "round",
    round: 2,
    direct: true,
  });
  expect(mocks.round).not.toHaveBeenCalled();
  act(() => result.current.confirmHostOverride());
  await act(async () => {});
  expect(props.startScheduledBreak).not.toHaveBeenCalled();
  expect(mocks.round).toHaveBeenCalledWith({
    p_session_id: "session",
    p_round_number: 2,
  });
  expect(props.initializeRoundClock).toHaveBeenCalledWith(2, 7);
});
it("releases the shared action lock and reports a failed start", async () => {
  const props = options();
  mocks.start.mockResolvedValue({
    data: null,
    error: { message: "Start denied" },
  });
  const { result } = renderHook(() => useHostSessionActions(props));
  await act(async () => {
    await result.current.startGame();
  });
  expect(props.setBusy).toHaveBeenLastCalledWith(false);
  expect(props.setError).toHaveBeenCalledWith("Start denied");
  expect(props.initializeRoundClock).not.toHaveBeenCalled();
});
it("returns a failed transition outcome without initializing or reloading after a denied move", async () => {
  const props = options();
  mocks.round.mockResolvedValueOnce({
    data: null,
    error: { message: "Round denied" },
  });
  const { result } = renderHook(() => useHostSessionActions(props));
  await act(async () => {
    expect(await result.current.moveToRound(2)).toBe("failed");
  });
  expect(props.load).not.toHaveBeenCalled();
});
it("recovers a thrown round transition and releases its action lock for retry", async () => {
  const props = options();
  mocks.round.mockRejectedValueOnce(new Error("Connection lost"));
  const { result } = renderHook(() => useHostSessionActions(props));
  await act(async () => {
    expect(await result.current.moveToRound(2)).toBe("failed");
  });
  expect(props.setBusy).toHaveBeenLastCalledWith(false);
  expect(props.setError).toHaveBeenCalledWith("Connection lost");
  await act(async () => {
    expect(await result.current.moveToRound(2)).toBe("moved");
  });
  expect(mocks.round).toHaveBeenCalledTimes(2);
});
it("attempts an expired break once, leaves a denial latched, and permits an explicit next-round retry", async () => {
  const props = {
    ...options(),
    hostBreakActive: true,
    breakResumeRound: 2,
    roundClockSeconds: 0,
  };
  mocks.round.mockResolvedValueOnce({
    data: null,
    error: { message: "Round denied" },
  });
  const { result, rerender } = renderHook(
    ({ value }) => useHostSessionActions(value),
    { initialProps: { value: props } },
  );
  await act(async () => {});
  expect(mocks.round).toHaveBeenCalledTimes(1);
  rerender({ value: { ...props, busy: true } });
  rerender({ value: { ...props, busy: false } });
  await act(async () => {});
  expect(mocks.round).toHaveBeenCalledTimes(1);
  act(() => result.current.requestMoveToRound(2));
  await act(async () => {});
  expect(mocks.round).toHaveBeenCalledTimes(2);
  expect(props.initializeRoundClock).toHaveBeenCalledWith(2, 0);
  rerender({ value: { ...props, busy: true } });
  rerender({ value: props });
  await act(async () => {});
  expect(mocks.round).toHaveBeenCalledTimes(2);
});
it("keeps a reward-blocked expiry quiet until the host explicitly retries", async () => {
  const props = {
    ...options(),
    hostBreakActive: true,
    breakResumeRound: 2,
    roundClockSeconds: 0,
  };
  const reward = {
    id: "reward",
    session_id: "session",
    challenge_id: "challenge",
    reward_method: "voting" as const,
    target_kind: "player" as const,
    points: 20,
    status: "open" as const,
    created_at: "2030-01-01",
    started_at: "2030-01-01",
    completed_at: null,
    released_at: null,
  };
  const initial: Parameters<typeof useHostSessionActions>[0] = {
    ...props,
    activeRewardRound: reward,
  };
  const { result, rerender } = renderHook(
    ({ value }: { value: Parameters<typeof useHostSessionActions>[0] }) =>
      useHostSessionActions(value),
    { initialProps: { value: initial } },
  );
  await act(async () => {});
  expect(mocks.round).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenCalledWith(
    expect.stringContaining("Complete or cancel"),
  );
  rerender({ value: props });
  await act(async () => {});
  expect(mocks.round).not.toHaveBeenCalled();
  act(() => result.current.requestMoveToRound(2));
  await act(async () => {});
  expect(mocks.round).toHaveBeenCalledTimes(1);
});
it("keeps autoplay confirmation on explicit retry and cancels without a command", async () => {
  const props = {
    ...options(),
    autoplayEnabled: true,
    hostBreakActive: true,
    breakResumeRound: 2,
    roundClockSeconds: 0,
  };
  mocks.round.mockResolvedValueOnce({
    data: null,
    error: { message: "Denied" },
  });
  const { result } = renderHook(() => useHostSessionActions(props));
  await act(async () => {});
  act(() => result.current.requestMoveToRound(2));
  expect(result.current.overridePrompt).toEqual({ kind: "round", round: 2 });
  act(() => result.current.setOverridePrompt(null));
  expect(mocks.round).toHaveBeenCalledTimes(1);
  act(() => result.current.requestMoveToRound(2));
  act(() => result.current.confirmHostOverride());
  await act(async () => {});
  expect(mocks.round).toHaveBeenCalledTimes(2);
  expect(
    localStorage.getItem("chaos-crawl-host-autoplay-override:session"),
  ).toBe("1");
});
it("initializes a moved round after RPC success and before notice/reload", async () => {
  const props = options();
  props.mainRounds.push(
    hostChallengeFixture({ round_number: 2, duration_minutes: 7 }),
  );
  const { result } = renderHook(() => useHostSessionActions(props));
  await act(async () => {
    await result.current.moveToRound(2);
  });
  expect(mocks.round).toHaveBeenCalledWith({
    p_session_id: "session",
    p_round_number: 2,
  });
  expect(props.initializeRoundClock).toHaveBeenCalledWith(2, 7);
  const initOrder = vi.mocked(props.initializeRoundClock).mock
    .invocationCallOrder[0];
  expect(initOrder).toBeGreaterThan(
    mocks.round.mock.invocationCallOrder[0] ?? 0,
  );
  expect(vi.mocked(props.load).mock.invocationCallOrder[0]).toBeGreaterThan(
    initOrder ?? 0,
  );
  expect(
    vi.mocked(props.setNotice).mock.invocationCallOrder.at(-1),
  ).toBeGreaterThan(initOrder ?? 0);
});
