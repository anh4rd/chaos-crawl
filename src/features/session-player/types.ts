export type SessionStatus = "lobby" | "live" | "completed";

export interface SessionInfo {
  id: string;
  name: string;
  venue_name: string | null;
  join_code: string;
  status: SessionStatus;
  current_round_number: number;
  round_count: number;
  teams_enabled: boolean;
  host_chooses_teams: boolean;
  team_size: number;
  player_limit: number;
  final_gallery_open: boolean;
  final_voting_open: boolean;
  final_vote_completed_at: string | null;
  final_vote_winner_player_id: string | null;
  final_vote_winner_evidence_id: string | null;
  final_vote_winner_points: number;
  final_vote_winner_vote_count: number;
}

export interface SessionPlayerInfo {
  id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  team_id: string | null;
  team_name: string | null;
}

export interface TeamInfo {
  id: string;
  name: string;
  member_count: number;
}

export interface LeaderboardEntry {
  player_id: string;
  name: string;
  score: number;
  team_id: string | null;
  team_name: string | null;
  avatar_url?: string | null;
}

export type PlayerPage = "game" | "leaderboard" | "side-challenges" | "final";

export interface ChallengeInfo {
  id: string;
  kind: "main" | "side";
  round_number?: number | null;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  allow_photo_upload: boolean;
  submission_status: "submitted" | "approved" | "rejected" | null;
  awarded_points: number;
}

export interface SessionView {
  session: SessionInfo;
  player: SessionPlayerInfo;
  teams: TeamInfo[];
  challenge: ChallengeInfo | null;
  side_challenges: ChallengeInfo[];
  my_submissions: Array<{
    challenge_id: string;
    status: "submitted" | "approved" | "rejected";
    awarded_points: number;
  }>;
}

export interface SharedGameTimer {
  session_id: string;
  round_number: number;
  remaining_seconds: number;
  is_running: boolean;
  is_on_break: boolean;
  resume_round_number: number | null;
  break_ends_at: string | null;
  updated_at: string;
}

export interface SecretMission {
  assignment_id: string;
  challenge_id: string;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  status: "sent" | "submitted" | "approved" | "rejected";
  scheduled_at: string;
  sent_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  awarded_points: number;
  allow_photo_upload: boolean;
}

export interface SecretReviewMedia {
  id: string;
  media_type: "image" | "video";
  storage_path: string;
}

export interface SecretReviewVoter {
  id: string;
  name: string;
  avatar_url: string | null;
  vote: "success" | "fail";
}

export interface SecretReviewLeaderboardEntry {
  player_id: string;
  name: string;
  avatar_url: string | null;
  team_id: string | null;
  team_name: string | null;
  score: number;
}

export interface SecretReviewView {
  open: boolean;
  voting_open: boolean;
  assignment_id: string | null;
  current_evidence_id: string | null;
  mission: {
    assignment_id: string;
    player_id: string;
    player_name: string;
    player_avatar_url: string | null;
    title: string;
    description: string;
    points: number;
    status: "pending" | "voting" | "results";
  } | null;
  media: SecretReviewMedia[];
  votes_cast: number;
  success_votes: number | null;
  fail_votes: number | null;
  my_vote: "success" | "fail" | null;
  outcome: "success" | "fail" | null;
  voters: SecretReviewVoter[];
  leaderboard: SecretReviewLeaderboardEntry[];
  my_final_reviews: Array<{
    assignment_id: string;
    outcome: "success" | "fail";
    points_awarded: number;
  }>;
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

export interface FinalGalleryItem {
  id: string;
  player_id: string;
  player_name: string;
  player_avatar_url: string | null;
  challenge_title: string;
  challenge_kind: "side";
  media_type: "image" | "video";
  storage_path: string;
  vote_count: number | null;
  is_my_vote: boolean;
  is_winner: boolean;
  voters: Array<{ id: string; name: string; avatar_url: string | null }>;
}

export interface PlayerRewardCandidate {
  id: string;
  name: string;
  team_name: string | null;
  score: number;
  member_count: number | null;
}

export interface PlayerRewardWinner {
  id: string;
  kind: "player" | "team";
  name: string;
  points: number;
  votes: number;
}

export interface PlayerRewardLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  team_name: string | null;
}

export interface PlayerRewardRound {
  id: string;
  challenge_id: string;
  challenge_title: string;
  method: "voting" | "host_awards" | "audience_cheers";
  target_kind: "player" | "team";
  points: number;
  status: "open" | "completed";
  votes_cast: number;
  my_vote_player_id: string | null;
  my_vote_team_id: string | null;
  candidates: PlayerRewardCandidate[];
  winners: PlayerRewardWinner[];
  leaderboard: PlayerRewardLeaderboardEntry[];
}

export interface FinalGalleryView {
  gallery_open: boolean;
  voting_open: boolean;
  voting_completed: boolean;
  sequence_completed: boolean;
  challenge_id: string | null;
  challenge_title: string | null;
  challenge_description: string | null;
  challenge_points: number;
  challenge_status: "pending" | "voting" | "results" | null;
  votes_cast: number;
  my_vote_id: string | null;
  items: FinalGalleryItem[];
  leaderboard: LeaderboardEntry[];
}
