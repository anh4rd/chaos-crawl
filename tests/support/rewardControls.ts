import type {
  RewardMethod,
  RewardTargetKind,
  SessionRewardRound,
} from "../../src/features/host-live/types";
import type { installSessionBackend } from "./sessionBackend";

type Backend = Awaited<ReturnType<typeof installSessionBackend>>;
export function seedRewardControls(
  backend: Backend,
  method: RewardMethod,
  target: RewardTargetKind,
  status: "open" | "completed" = "open",
) {
  backend.session.teams_enabled = target === "team";
  const team = {
    id: "team-1",
    session_id: "test-session",
    name: "Team Chaos",
    avatar_url: null,
    created_at: "2030-01-01T12:00:00Z",
  };
  backend.rows.cc_game_session_teams = target === "team" ? [team] : [];
  backend.rows.cc_game_session_players = [
    { ...backend.player, team_id: target === "team" ? team.id : null },
    {
      ...backend.player,
      id: "sam",
      name: "Sam",
      score: 30,
      team_id: target === "team" ? team.id : null,
    },
  ];
  const round: SessionRewardRound = {
    id: "reward-1",
    session_id: "test-session",
    challenge_id: "test-challenge",
    reward_method: method,
    target_kind: target,
    points: 20,
    status,
    created_at: "2030-01-01T12:00:00Z",
    started_at: "2030-01-01T12:00:00Z",
    completed_at: status === "completed" ? "2030-01-01T12:01:00Z" : null,
    released_at: null,
  };
  backend.rows.cc_game_session_reward_rounds = [round];
  return round;
}
