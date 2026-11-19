import type { RewardMethod, RewardTargetKind } from "../../types/hostSession";
export type SessionStatus = "lobby" | "live" | "completed";

export type HostTab =
  | "game"
  | "leaderboard"
  | "side-challenges"
  | "reward-round"
  | "final-round"
  | "host-controls";

export interface GameSession {
  id: string;
  host_game_id: string | null;
  host_id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  join_code: string;
  status: SessionStatus;
  teams_enabled: boolean;
  host_chooses_teams: boolean;
  team_size: number;
  player_limit: number;
  host_participates: boolean;
  host_player_id: string | null;
  current_round_number: number;
  reward_methods: RewardMethod[];
  created_at: string;
  final_gallery_open: boolean;
  final_voting_open: boolean;
  final_vote_completed_at: string | null;
  final_vote_winner_player_id: string | null;
  final_vote_winner_evidence_id: string | null;
  final_vote_winner_points: number;
  final_vote_winner_vote_count: number;
}

export interface SessionChallenge {
  id: string;
  session_id: string;
  kind: "main" | "side" | "secret";
  round_number: number | null;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  sort_order: number;
  allow_photo_upload: boolean;
}

export interface GameScheduleItem {
  id?: string;
  type: string;
  title: string;
  duration: number;
  taskId?: string;
  phase?: string;
}

export interface SessionPlayer {
  id: string;
  name: string;
  avatar_url: string | null;
  team_id: string | null;
  score: number;
  joined_at: string;
  last_seen_at: string;
}

export interface SessionTeam {
  id: string;
  name: string;
  created_at: string;
}

export interface SessionSubmission {
  id: string;
  player_id: string;
  challenge_id: string;
  status: "submitted" | "approved" | "rejected";
  awarded_points: number;
  submitted_at: string;
}

export interface SecretMissionAssignment {
  id: string;
  session_id: string;
  player_id: string;
  challenge_id: string;
  status:
    "scheduled" | "sent" | "submitted" | "approved" | "rejected" | "cancelled";
  scheduled_at: string;
  sent_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  awarded_points: number;
  final_review_outcome: "success" | "fail" | null;
  created_at: string;
}

export interface SecretReviewState {
  session_id: string;
  is_open: boolean;
  voting_open: boolean;
  current_assignment_id: string | null;
  current_evidence_id: string | null;
}

export interface SecretReviewAssignment {
  session_id: string;
  assignment_id: string;
  status: "pending" | "voting" | "results";
  success_votes: number;
  fail_votes: number;
  votes_cast: number;
  outcome: "success" | "fail" | null;
  points_awarded: number;
  opened_at: string | null;
  closed_at: string | null;
}

export interface SecretReviewVote {
  session_id: string;
  assignment_id: string;
  player_id: string;
  vote: "success" | "fail";
  voted_at: string;
}

export interface SessionEvidence {
  id: string;
  session_id: string;
  player_id: string;
  challenge_id: string;
  secret_assignment_id: string | null;
  storage_path: string;
  media_type: "image" | "video";
  saved_for_final: boolean;
  created_at: string;
}

export interface SessionFinalVote {
  session_id: string;
  challenge_id: string;
  player_id: string;
  evidence_id: string;
  voted_at: string;
}

export interface SessionFinalRoundState {
  session_id: string;
  is_open: boolean;
  voting_open: boolean;
  slideshow_challenge_id: string | null;
  slideshow_evidence_id: string | null;
}

export interface SessionFinalRoundChallenge {
  session_id: string;
  challenge_id: string;
  status: "pending" | "voting" | "results";
  votes_cast: number;
  opened_at: string | null;
  closed_at: string | null;
}

export interface PresentationConnectionLike {
  state: string;
  close: () => void;
  addEventListener: (type: "statechange", listener: () => void) => void;
  removeEventListener: (type: "statechange", listener: () => void) => void;
}

export type PresentationRequestConstructor = new (urls: string[]) => {
  start: () => Promise<PresentationConnectionLike>;
};

export interface SessionRewardRound {
  id: string;
  session_id: string;
  challenge_id: string;
  reward_method: RewardMethod;
  target_kind: RewardTargetKind;
  points: number;
  status: "open" | "completed" | "cancelled";
  created_at: string;
  started_at: string;
  completed_at: string | null;
  released_at: string | null;
}

export interface SessionRewardVote {
  id: string;
  session_id: string;
  reward_round_id: string;
  voter_player_id: string;
  target_player_id: string | null;
  target_team_id: string | null;
  voted_at: string;
}

export interface SessionRewardAward {
  id: string;
  session_id: string;
  reward_round_id: string;
  winner_player_id: string | null;
  winner_team_id: string | null;
  points_awarded: number;
  votes_received: number;
}
