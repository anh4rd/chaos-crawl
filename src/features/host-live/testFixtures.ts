import type { GameSession, SessionChallenge } from "./types";

export function hostSessionFixture(
  overrides: Partial<GameSession> = {},
): GameSession {
  return {
    id: "session",
    host_game_id: "plan",
    host_id: "host",
    name: "Test party",
    event_date: null,
    start_time: null,
    end_time: null,
    venue_name: null,
    join_code: "123456",
    status: "live",
    teams_enabled: false,
    host_chooses_teams: false,
    team_size: 2,
    player_limit: 12,
    host_participates: false,
    host_player_id: null,
    secret_mission_points: 10,
    current_round_number: 1,
    reward_methods: ["voting", "host_awards", "audience_cheers"],
    created_at: "2030-01-01",
    final_gallery_open: false,
    final_voting_open: false,
    final_vote_completed_at: null,
    final_vote_winner_player_id: null,
    final_vote_winner_evidence_id: null,
    final_vote_winner_points: 0,
    final_vote_winner_vote_count: 0,
    ...overrides,
  };
}
export function hostChallengeFixture(
  overrides: Partial<SessionChallenge> = {},
): SessionChallenge {
  return {
    id: "challenge",
    session_id: "session",
    kind: "main",
    round_number: 1,
    title: "Entrance",
    description: "Enter with style.",
    points: 20,
    duration_minutes: 5,
    sort_order: 1,
    allow_photo_upload: false,
    ...overrides,
  };
}
