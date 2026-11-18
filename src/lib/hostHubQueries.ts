import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type {
  HostDirectoryEntry,
  HostGame,
  HostPreviewIdentity,
} from "../types/hostHub";
const summaryFields =
  "id,name,event_date,start_time,end_time,player_count,venue_name,status,plan_data";
export async function readHostGames(
  hostId: string,
  view: "home" | "games",
  dateKey: string,
): Promise<ApiResult<HostGame[]>> {
  if (view === "games")
    return runApi<HostGame[]>(() =>
      supabase
        .from("host_games")
        .select(summaryFields)
        .eq("host_id", hostId)
        .order("created_at", { ascending: false }),
    );
  const [upcoming, past] = await Promise.all([
    runApi<HostGame[]>(() =>
      supabase
        .from("host_games")
        .select(summaryFields)
        .eq("host_id", hostId)
        .neq("status", "completed")
        .or(`event_date.is.null,event_date.gte.${dateKey}`)
        .order("created_at", { ascending: false })
        .limit(3),
    ),
    runApi<HostGame[]>(() =>
      supabase
        .from("host_games")
        .select(summaryFields)
        .eq("host_id", hostId)
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
