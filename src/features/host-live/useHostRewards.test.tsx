import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { hostChallengeFixture, hostSessionFixture } from "./testFixtures";
import { useHostRewards } from "./useHostRewards";
import {
  hostCompleteSessionRewardRound,
  hostStartSessionRewardRound,
} from "../../lib/hostRewardCommands";
import type { SessionRewardRound } from "./types";

vi.mock("../../lib/hostRewardCommands", () => ({
  hostCompleteSessionRewardRound: vi.fn(),
  hostStartSessionRewardRound: vi.fn(),
}));
vi.mock("../../lib/sessionParticipantCommands", () => ({}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
function options(): Parameters<typeof useHostRewards>[0] {
  return {
    rewardRounds: [],
    currentChallenge: hostChallengeFixture(),
    rewardVotes: [],
    rewardAwards: [],
    challenges: [hostChallengeFixture()],
    session: hostSessionFixture(),
    teams: [],
    players: [],
    setError: vi.fn(),
    setBusy: vi.fn(() => true),
    setNotice: vi.fn(),
    load: vi.fn(async () => {}),
    busy: false,
    ensureHostPlayerToken: vi.fn(async () => "host-token"),
  };
}
it("retains an explicit challenge selection across data refreshes", () => {
  const props = options();
  const { result, rerender } = renderHook(
    ({ value }) => useHostRewards(value),
    { initialProps: { value: props } },
  );
  expect(result.current.rewardChallengeId).toBe("challenge");
  act(() => result.current.setRewardChallengeId("chosen"));
  rerender({
    value: { ...props, challenges: [hostChallengeFixture({ id: "other" })] },
  });
  expect(result.current.rewardChallengeId).toBe("chosen");
});
it("preserves an enabled method and falls back when setup disables it", () => {
  const props = options();
  const { result, rerender } = renderHook(
    ({ value }) => useHostRewards(value),
    { initialProps: { value: props } },
  );
  act(() => result.current.setRewardMethod("host_awards"));
  rerender({ value: { ...props, challenges: [...props.challenges] } });
  expect(result.current.rewardMethod).toBe("host_awards");
  rerender({
    value: {
      ...props,
      session: hostSessionFixture({ reward_methods: ["voting"] }),
    },
  });
  expect(result.current.rewardMethod).toBe("voting");
});

it("defaults review settings on opening, retains edits across refresh and rejects a changed round", () => {
  const props = options();
  props.session = hostSessionFixture({ teams_enabled: true });
  props.currentChallenge = hostChallengeFixture({ points: 25 });
  const { result, rerender } = renderHook(
    ({ value }) => useHostRewards(value),
    { initialProps: { value: props } },
  );
  act(() => result.current.openPointReview());
  expect(result.current.rewardTargetKind).toBe("team");
  expect(result.current.rewardPoints).toBe(25);
  act(() => {
    result.current.setRewardTargetKind("player");
    result.current.setRewardPoints(37);
  });
  rerender({
    value: { ...props, currentChallenge: hostChallengeFixture({ points: 50 }) },
  });
  expect(result.current.rewardTargetKind).toBe("player");
  expect(result.current.rewardPoints).toBe(37);
  rerender({
    value: {
      ...props,
      currentChallenge: hostChallengeFixture({ id: "next", round_number: 2 }),
    },
  });
  const view = render(
    <form onSubmit={result.current.startRewardRound} aria-label="Review" />,
  );
  fireEvent.submit(view.getByRole("form", { name: "Review" }));
  expect(props.setError).toHaveBeenCalledWith(
    "The current round changed. Close and reopen review to continue.",
  );
  expect(hostStartSessionRewardRound).not.toHaveBeenCalled();
});

function rewardRound(
  method: SessionRewardRound["reward_method"],
  target: SessionRewardRound["target_kind"],
): SessionRewardRound {
  return {
    id: "reward",
    session_id: "session",
    challenge_id: "challenge",
    reward_method: method,
    target_kind: target,
    points: 20,
    status: "open",
    created_at: "2030-01-01",
    started_at: "2030-01-01",
    completed_at: null,
    released_at: null,
  };
}
it.each([
  { method: "host_awards", target: "player", edited: 37, awarded: 37 },
  { method: "audience_cheers", target: "team", edited: -5, awarded: 0 },
  { method: "host_awards", target: "team", edited: 20000, awarded: 10000 },
  { method: "audience_cheers", target: "player", edited: NaN, awarded: 0 },
] as const)(
  "confirms the submitted $method $target award of $awarded points",
  async ({ method, target, edited, awarded }) => {
    const props = options();
    props.rewardRounds = [rewardRound(method, target)];
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(hostCompleteSessionRewardRound).mockResolvedValue({
      data: { winner_count: 1, points_awarded: awarded },
      error: null,
    });
    const { result } = renderHook(() => useHostRewards(props));
    act(() => {
      result.current.setSelectedRewardWinnerIds(["winner"]);
      result.current.setRewardFinalPoints(edited);
    });
    await act(() => result.current.completeRewardRound());
    expect(confirm).toHaveBeenCalledWith(
      `Award ${awarded} points to 1 selected winner?`,
    );
    expect(hostCompleteSessionRewardRound).toHaveBeenCalledExactlyOnceWith({
      p_reward_round_id: "reward",
      p_winner_player_ids: target === "player" ? ["winner"] : [],
      p_winner_team_ids: target === "team" ? ["winner"] : [],
      p_points: awarded,
    });
    expect(props.load).toHaveBeenCalledTimes(1);
  },
);
it("keeps voting confirmation on configured points and sends no manual override", async () => {
  const props = options();
  props.rewardRounds = [rewardRound("voting", "player")];
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(hostCompleteSessionRewardRound).mockResolvedValue({
    data: null,
    error: null,
  });
  const { result } = renderHook(() => useHostRewards(props));
  act(() => result.current.setRewardFinalPoints(37));
  await act(() => result.current.completeRewardRound());
  expect(confirm).toHaveBeenCalledWith(
    "Close voting and award 20 points to the top vote-getter? Tied top votes will all win.",
  );
  expect(hostCompleteSessionRewardRound).toHaveBeenCalledExactlyOnceWith({
    p_reward_round_id: "reward",
    p_winner_player_ids: [],
    p_winner_team_ids: [],
    p_points: null,
  });
});
it("cancels a manual confirmation without an award, busy lock or reload", async () => {
  const props = options();
  props.rewardRounds = [rewardRound("host_awards", "player")];
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const { result } = renderHook(() => useHostRewards(props));
  act(() => result.current.setSelectedRewardWinnerIds(["winner"]));
  await act(() => result.current.completeRewardRound());
  expect(hostCompleteSessionRewardRound).not.toHaveBeenCalled();
  expect(props.setBusy).not.toHaveBeenCalled();
  expect(props.load).not.toHaveBeenCalled();
});
