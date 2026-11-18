export interface PlatformGame {
  game_id: string;
  name: string;
  host_email: string | null;
  status: string;
  event_date: string | null;
  created_at: string;
  player_count: number;
  session_count: number;
  live_sessions: number;
}
export interface PlatformGameDetail {
  game: Record<string, unknown>;
  sessions: Array<{
    id: string;
    name: string;
    join_code: string;
    status: string;
    created_at: string;
    players: Array<{ name: string; score: number; team_name: string | null }>;
  }>;
}
