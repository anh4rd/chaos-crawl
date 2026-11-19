import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type { CommunitySubmission, HostFavourite } from "../types/hostExplore";

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
