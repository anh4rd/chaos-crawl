import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type { HostSavedItem } from "../types/hostSaved";
export function readHostFavourites(
  hostId: string,
): Promise<ApiResult<HostSavedItem[]>> {
  return runApi<HostSavedItem[]>(() =>
    supabase
      .from("host_favourites")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false }),
  );
}
