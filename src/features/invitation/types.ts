export interface InviteData {
  enabled: boolean;
  game_name: string;
  event_date: string | null;
  start_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  game_photo_url: string | null;
  player_limit: number;
  joined_players: number;
  rules: string | null;
  demo_enabled: boolean;
  pre_game_enabled: boolean;
  pre_game_task: { title: string; description: string } | null;
  preparation: Array<{ title: string; prep: string }>;
}
