import { beforeEach, expect, it, vi } from "vitest";
import { hostCompleteSessionRewardRound } from "./hostRewardCommands";
import { assignSessionTeam, uploadHostAvatar } from "./hostRosterCommands";
import { writeSharedTimer } from "./hostSessionCommands";
import {
  playerCastSecretReviewVote,
  playerCastSessionFinalRoundVote,
} from "./sessionParticipantCommands";

const mocks = vi.hoisted(() => {
  const execute = vi.fn<() => Promise<{ data: unknown; error: unknown }>>();
  const query = {
    update: vi.fn(),
    eq: vi.fn(),
    upsert: vi.fn(),
    then: (
      ...args: Parameters<Promise<{ data: unknown; error: unknown }>["then"]>
    ) => execute().then(...args),
  };
  return { execute, query, from: vi.fn(), rpc: vi.fn(), upload: vi.fn() };
});
vi.mock("./sessionSupabase", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    storage: { from: () => ({ upload: mocks.upload }) },
  },
}));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.execute.mockResolvedValue({ data: null, error: null });
  mocks.from.mockReturnValue(mocks.query);
  mocks.query.update.mockReturnValue(mocks.query);
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.query.upsert.mockReturnValue(mocks.query);
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.upload.mockResolvedValue({ data: null, error: null });
});

it("scopes team assignment to both the player and session", async () => {
  await assignSessionTeam({ team_id: "team" }, "player", "session");
  expect(mocks.from).toHaveBeenCalledWith("cc_game_session_players");
  expect(mocks.query.update).toHaveBeenCalledWith({ team_id: "team" });
  expect(mocks.query.eq.mock.calls).toEqual([
    ["id", "player"],
    ["session_id", "session"],
  ]);
});
it("keeps the complete timer snapshot and upsert conflict key", async () => {
  const snapshot = {
    session_id: "session",
    round_number: 2,
    remaining_seconds: 120,
    is_running: true,
    is_on_break: true,
    resume_round_number: 3,
    break_ends_at: "2030-01-01T12:02:00Z",
    updated_at: "2030-01-01T12:00:00Z",
  };
  await writeSharedTimer(snapshot);
  expect(mocks.query.upsert).toHaveBeenCalledWith(snapshot, {
    onConflict: "session_id",
  });
});
it("preserves manual team awards and participant identity in voting payloads", async () => {
  const award = {
    p_reward_round_id: "reward",
    p_winner_player_ids: [],
    p_winner_team_ids: ["team-a", "team-b"],
    p_points: 15,
  };
  await hostCompleteSessionRewardRound(award);
  await playerCastSessionFinalRoundVote({
    p_join_code: "123456",
    p_player_token: "host-player-token",
    p_evidence_id: "evidence",
  });
  await playerCastSecretReviewVote({
    p_join_code: "123456",
    p_player_token: "ordinary-token",
    p_assignment_id: "mission",
    p_vote: "fail",
  });
  expect(mocks.rpc.mock.calls).toEqual([
    ["cc_host_complete_session_reward_round", award],
    [
      "cc_player_cast_session_final_round_vote",
      {
        p_join_code: "123456",
        p_player_token: "host-player-token",
        p_evidence_id: "evidence",
      },
    ],
    [
      "cc_player_cast_secret_review_vote",
      {
        p_join_code: "123456",
        p_player_token: "ordinary-token",
        p_assignment_id: "mission",
        p_vote: "fail",
      },
    ],
  ]);
});
it("normalizes database, storage and thrown transport failures", async () => {
  mocks.execute.mockResolvedValue({
    data: null,
    error: { message: "Assignment denied", code: "42501" },
  });
  expect(
    (await assignSessionTeam({ team_id: null }, "player", "session")).error,
  ).toEqual({ message: "Assignment denied", code: "42501" });
  mocks.upload.mockRejectedValue(new Error("Storage unavailable"));
  expect(
    (
      await uploadHostAvatar(
        "session/avatar.png",
        new File(["image"], "avatar.png"),
        { upsert: true, contentType: "image/png" },
      )
    ).error?.message,
  ).toBe("Storage unavailable");
  mocks.rpc.mockRejectedValue(new Error("Offline"));
  expect(
    (
      await playerCastSessionFinalRoundVote({
        p_join_code: "123456",
        p_player_token: "token",
        p_evidence_id: "evidence",
      })
    ).error?.message,
  ).toBe("Offline");
});
