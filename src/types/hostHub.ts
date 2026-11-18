export interface HostDirectoryEntry {
  host_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  game_count: number;
}

export interface HostPreviewIdentity {
  id: string;
  email: string | null;
  display_name: string | null;
}

export interface HostGame {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  player_count: number;
  venue_name: string | null;
  status: "draft" | "planned" | "live" | "completed";
  plan_data?: {
    gamePhotoUrl?: string | null;
    selectedTasks?: Array<{
      id?: string;
      title: string;
      description?: string;
      kind?: string;
    }>;
  } | null;
}
