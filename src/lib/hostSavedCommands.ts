import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
export function removeHostFavourite({
  id,
}: {
  id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.from("host_favourites").delete().eq("id", id),
  );
}
