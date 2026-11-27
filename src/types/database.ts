// Application-side schema derived from the queries in this repository.
// Regenerate from Supabase when the deployed schema is available; this is not
// a claim about server defaults, relationships, or row-level security policies.
export type ChallengeType = "main" | "side" | "bonus";
export type ScoreChallengeType = ChallengeType | "vote" | "manual";
export type Player = {
  id: string;
  name: string;
  team: string | null;
  team_id?: string | number | null;
  score: number;
  points?: number | null;
  avatar_url?: string | null;
};
export type Pub = {
  id: number;
  name: string;
  sort_order: number | null;
  order_index?: number | null;
};
export type Challenge = {
  id: number;
  pub_id: number | null;
  title: string;
  description: string | null;
  points: number;
  reveal_order: number;
  allow_photo_upload: boolean;
};
export type SideChallenge = {
  id: number;
  title: string;
  description: string;
  points: number;
  active: boolean;
};
export type PubSubChallenge = Omit<SideChallenge, "description"> & {
  pub_id: number;
  description: string | null;
};
export type ChallengeCompletion = {
  id: string | number;
  player_id: string;
  challenge_type: ChallengeType;
  challenge_id: string;
  points: number;
  photo_id: string | number | null;
  completed_at: string | null;
};
export type GameState = {
  id: number;
  current_pub: string;
  current_challenge: string;
  challenge_description: string;
  current_challenge_id: number | null;
  current_challenge_order: number;
  voting_open: boolean;
  voting_target: "player" | "team";
  show_vote_results: boolean;
  slideshow_open: boolean;
  scheduled_challenge_id: number | null;
  scheduled_reveal_at: string | null;
  join_code?: string;
  event_name?: string;
  event_image_url?: string | null;
  join_open?: boolean;
  game_status?: "lobby" | "live" | "finished";
  updated_at?: string;
};
export type Media = {
  id: string | number;
  player_id: string | null;
  image_url: string;
  uploaded_at: string;
  media_type: "image" | "video" | null;
  player_name: string | null;
  team: string | null;
  challenge: string | null;
  pub: string | null;
  points: number | null;
};
export type ScoreEvent = {
  id: string;
  player_id: string | null;
  team_name: string | null;
  challenge_type: ScoreChallengeType;
  challenge_id: string;
  challenge_title: string;
  points: number;
  reason: string | null;
  awarded_at: string;
};
export type Team = { id: string; name: string; avatar_url?: string | null };
export type Vote = {
  id: string | number;
  voter_id: string;
  voted_for_player_id: string | null;
  voted_for_team_id: string | null;
  challenge_name: string;
};
type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      players: Table<Player, "name">;
      pubs: Table<Pub, "name">;
      challenges: Table<Challenge, "title" | "points">;
      side_challenges: Table<SideChallenge, "title" | "points">;
      pub_sub_challenges: Table<PubSubChallenge, "pub_id" | "title" | "points">;
      challenge_completions: Table<
        ChallengeCompletion,
        "player_id" | "challenge_type" | "challenge_id" | "points"
      >;
      game_state: Table<GameState, "id">;
      photos: Table<Media, "image_url" | "player_id">;
      score_events: Table<
        ScoreEvent,
        "challenge_type" | "challenge_id" | "challenge_title" | "points"
      >;
      teams: Table<Team, "name">;
      votes: Table<Vote, "voter_id" | "challenge_name">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
