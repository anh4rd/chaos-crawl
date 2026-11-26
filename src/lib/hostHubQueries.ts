import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type {
  HostDirectoryEntry,
  GameCohost,
  HostGame,
  HostPreviewIdentity,
  HostChallengeOverview,
} from "../types/hostHub";
const summaryFields =
  "id,host_id,name,event_date,start_time,end_time,player_count,venue_name,status,plan_data";
export async function readHostGames(
  view: "home" | "games",
  dateKey: string,
): Promise<ApiResult<HostGame[]>> {
  if (view === "games")
    return runApi<HostGame[]>(() =>
      supabase
        .from("host_games")
        .select(summaryFields)
        .order("created_at", { ascending: false }),
    );
  const [upcoming, past] = await Promise.all([
    runApi<HostGame[]>(() =>
      supabase
        .from("host_games")
        .select(summaryFields)
        .neq("status", "completed")
        .or(`event_date.is.null,event_date.gte.${dateKey}`)
        .order("created_at", { ascending: false })
        .limit(3),
    ),
    runApi<HostGame[]>(() =>
      supabase
        .from("host_games")
        .select(summaryFields)
        .or(`status.eq.completed,event_date.lt.${dateKey}`)
        .order("created_at", { ascending: false })
        .limit(3),
    ),
  ]);
  return {
    data: [...(upcoming.data ?? []), ...(past.data ?? [])],
    error: upcoming.error ?? past.error,
  };
}
export function readHostPreview(hostId: string) {
  return runApi<{ host: HostPreviewIdentity; games: HostGame[] }>(() =>
    supabase.rpc("cc_super_admin_host_hub", { p_host_id: hostId }),
  );
}
export function readHostDirectory() {
  return runApi<HostDirectoryEntry[]>(() =>
    supabase.rpc("cc_super_admin_list_hosts"),
  );
}
export function readPlatformAdmin() {
  return runApi<boolean>(() => supabase.rpc("cc_is_platform_admin"));
}

export function readGameCohosts(hostGameId: string) {
  return runApi<GameCohost[]>(() =>
    supabase.rpc("cc_list_game_cohosts", { p_host_game_id: hostGameId }),
  );
}

export function readHostChallengeOverview(hostId: string) {
  return runApi<HostChallengeOverview>(() =>
    supabase.rpc("cc_super_admin_host_challenges", { p_host_id: hostId }),
  );
}
