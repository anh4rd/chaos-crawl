import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hostChallengeFixture, hostSessionFixture } from "./testFixtures";
import { useHostFinalRound } from "./useHostFinalRound";
import { useHostSecretReview } from "./useHostSecretReview";
import { useHostRewards } from "./useHostRewards";
import type { SessionRewardRound, SecretReviewState } from "./types";
const commands = vi.hoisted(() => ({
  playerCastSessionFinalRoundVote: vi.fn(),
  playerCastSessionRewardVote: vi.fn(),
  playerCastSecretReviewVote: vi.fn(),
}));
vi.mock("../../lib/sessionParticipantCommands", () => commands);
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  for (const fn of Object.values(commands))
    fn.mockResolvedValue({ data: null, error: null });
});
function options() {
  const secretReviewState: SecretReviewState = {
    session_id: "session",
    is_open: true,
    voting_open: true,
    current_assignment_id: "assignment",
    current_evidence_id: null,
  };
  const round: SessionRewardRound = {
    id: "reward",
    session_id: "session",
    challenge_id: "challenge",
    reward_method: "voting",
    target_kind: "player",
    points: 20,
    status: "open",
    created_at: "now",
    started_at: "now",
    completed_at: null,
    released_at: null,
  };
  return {
    session: hostSessionFixture({
      host_participates: true,
      host_player_id: "host-player",
    }),
    setBusy: vi.fn(() => true),
    setError: vi.fn(),
    setNotice: vi.fn(),
    load: vi.fn(async () => {}),
    busy: false,
    setActiveTab: vi.fn(),
    setHostParticipation: vi.fn(async () => true),
    ensureHostPlayerToken: vi.fn(
      async (onRecovered?: () => void): Promise<string | null> => {
        onRecovered?.();
        return "recovered-token";
      },
    ),
    nextReviewedFinalChallenge: hostChallengeFixture(),
    nextPendingFinalChallenge: undefined,
    selectedFinalChallenge: hostChallengeFixture(),
    challenges: [hostChallengeFixture()],
    finalSideEvidence: [],
    selectedFinalChallengeStatus: "voting" as const,
    evidence: [],
    secretAssignments: [],
    secretReviewState,
    rewardRounds: [round],
    rewardVotes: [],
    rewardAwards: [],
    currentChallenge: hostChallengeFixture(),
    teams: [],
    players: [],
  };
}
function voting(props: ReturnType<typeof options>) {
  return renderHook(() => ({
    final: useHostFinalRound(props),
    secret: useHostSecretReview(props),
    reward: useHostRewards(props),
  }));
}
it.each(["final", "secret", "reward"] as const)(
  "delegates %s recovery and preserves exact vote payload and navigation",
  async (domain) => {
    localStorage.setItem("chaos-crawl-host-player:session", "old-token");
    const props = options();
    const { result } = voting(props);
    await act(async () => {
      if (domain === "final")
        await result.current.final.castHostFinalVote("evidence");
      if (domain === "secret")
        await result.current.secret.castHostSecretReviewVote("fail");
      if (domain === "reward")
        await result.current.reward.castHostRewardVote("candidate");
    });
    expect(props.ensureHostPlayerToken).toHaveBeenCalledOnce();
    if (domain === "final") {
      expect(props.setActiveTab).toHaveBeenCalledWith("final-round");
      expect(commands.playerCastSessionFinalRoundVote).toHaveBeenCalledWith({
        p_join_code: "123456",
        p_player_token: "recovered-token",
        p_evidence_id: "evidence",
      });
    } else if (domain === "secret") {
      expect(props.setActiveTab).toHaveBeenCalledWith("side-challenges");
      expect(commands.playerCastSecretReviewVote).toHaveBeenCalledWith({
        p_join_code: "123456",
        p_player_token: "recovered-token",
        p_assignment_id: "assignment",
        p_vote: "fail",
      });
    } else {
      expect(props.setActiveTab).not.toHaveBeenCalled();
      expect(commands.playerCastSessionRewardVote).toHaveBeenCalledWith({
        p_join_code: "123456",
        p_player_token: "recovered-token",
        p_reward_round_id: "reward",
        p_target_player_id: "candidate",
        p_target_team_id: null,
      });
    }
    expect(props.load).toHaveBeenCalledOnce();
  },
);
it.each(["final", "secret", "reward"] as const)(
  "does not overwrite participation failure or vote after refused %s recovery",
  async (domain) => {
    const props = options();
    props.ensureHostPlayerToken.mockImplementation(async () => {
      props.setError("Specific join failure");
      return null;
    });
    const { result } = voting(props);
    await act(async () => {
      if (domain === "final")
        await result.current.final.castHostFinalVote("evidence");
      if (domain === "secret")
        await result.current.secret.castHostSecretReviewVote("success");
      if (domain === "reward")
        await result.current.reward.castHostRewardVote("candidate");
    });
    expect(props.setError).toHaveBeenLastCalledWith("Specific join failure");
    for (const command of Object.values(commands))
      expect(command).not.toHaveBeenCalled();
    expect(props.load).not.toHaveBeenCalled();
    expect(props.setActiveTab).not.toHaveBeenCalled();
  },
);
it("preserves team reward payloads", async () => {
  const props = options();
  props.rewardRounds[0].target_kind = "team";
  const { result } = voting(props);
  await act(async () => {
    await result.current.reward.castHostRewardVote("team");
  });
  expect(commands.playerCastSessionRewardVote).toHaveBeenLastCalledWith({
    p_join_code: "123456",
    p_player_token: "recovered-token",
    p_reward_round_id: "reward",
    p_target_player_id: null,
    p_target_team_id: "team",
  });
});

it("retains busy and phase guards before credential recovery", async () => {
  const props = options();
  props.busy = true;
  const { result } = voting(props);
  await act(async () => {
    await result.current.final.castHostFinalVote("evidence");
    await result.current.secret.castHostSecretReviewVote("success");
    await result.current.reward.castHostRewardVote("candidate");
  });
  expect(props.ensureHostPlayerToken).not.toHaveBeenCalled();
  for (const command of Object.values(commands))
    expect(command).not.toHaveBeenCalled();
});
it("retains vote failure feedback and does not reload after a rejected vote", async () => {
  const props = options();
  commands.playerCastSessionFinalRoundVote.mockResolvedValue({
    data: null,
    error: { message: "Voting closed" },
  });
  const { result } = voting(props);
  await act(async () => {
    await result.current.final.castHostFinalVote("evidence");
  });
  expect(props.setError).toHaveBeenLastCalledWith("Voting closed");
  expect(props.setBusy).toHaveBeenLastCalledWith(false);
  expect(props.load).not.toHaveBeenCalled();
});
