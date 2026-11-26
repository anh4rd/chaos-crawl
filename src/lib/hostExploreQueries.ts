import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type { CommunitySubmission, HostFavourite } from "../types/hostExplore";

export interface ExploreGame {
  id: string;
  name: string;
  status: "draft" | "planned" | "live" | "completed";
}

export function readExploreGames(): Promise<ApiResult<ExploreGame[]>> {
  return runApi<ExploreGame[]>(() =>
    supabase
      .from("host_games")
      .select("id,name,status")
      .order("created_at", { ascending: false }),
  );
}

export function readExploreGamePlan(id: string) {
  return runApi<{
    id: string;
    status: string;
    plan_data: unknown;
    updated_at: string;
  }>(() =>
    supabase
      .from("host_games")
      .select("id,status,plan_data,updated_at")
      .eq("id", id)
      .maybeSingle(),
  );
}

export function readExploreActiveSessions(id: string) {
  return runApi<{ id: string }[]>(() =>
    supabase
      .from("cc_game_sessions")
      .select("id")
      .eq("host_game_id", id)
      .in("status", ["lobby", "live"])
      .limit(1),
  );
}

export function readExploreFavourites(
  hostId: string,
): Promise<ApiResult<HostFavourite[]>> {
  return runApi<HostFavourite[]>(() =>
    supabase
      .from("host_favourites")
      .select("id,item_type,item_id,item_data")
      .eq("host_id", hostId),
  );
}

export function readCommunitySubmissions(): Promise<
  ApiResult<CommunitySubmission[]>
> {
  return runApi<CommunitySubmission[]>(() =>
    supabase
      .from("cc_catalog_submissions")
      .select(
        "id,item_type,title,description,payload,status,submitted_by,review_note,created_at",
      )
      .order("created_at", { ascending: false }),
  );
}
