export type RewardMethod = "voting" | "host_awards" | "audience_cheers";

export type RewardTargetKind = "player" | "team";

export interface HostSessionSettings {
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  player_limit: number;
  teams_enabled: boolean;
  host_chooses_teams: boolean;
  team_size: number;
  reward_methods: RewardMethod[];
}

export interface PlannedTaskInfo {
  id?: string;
  title?: string;
  equipment?: string[];
  setup?: string;
  prep?: string;
}
