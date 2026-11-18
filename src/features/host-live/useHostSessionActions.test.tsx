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
    setOverridePrompt: vi.fn(),
    setBusy: vi.fn(() => true),
    setNotice: vi.fn(),
    setSession: vi.fn(),
    sessionId: "session",
    setAutoplayOverridden: vi.fn(),
    mainRounds: [hostChallengeFixture()],
    saveSharedTimer: vi.fn(async () => true),
    load: vi.fn(async () => {}),
    busy: false,
    activeRewardRound: null,
    hostBreakActive: false,
    plannedBreakAfter: vi.fn(() => 0),
    startScheduledBreak: vi.fn(async () => {}),
    setHostBreakActive: vi.fn(),
    setBreakResumeRound: vi.fn(),
    breakAdvanceRequested: { current: false },
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
  expect(props.saveSharedTimer).toHaveBeenCalledWith(1, 300, false, false);
  expect(
    vi.mocked(props.saveSharedTimer).mock.invocationCallOrder[0],
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
  expect(props.startScheduledBreak).toHaveBeenCalledWith(2, 2, false);
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
  expect(props.saveSharedTimer).not.toHaveBeenCalled();
});
