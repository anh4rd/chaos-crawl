import type { ApiResult } from "./apiResult";
import { supabase } from "./supabase";

export async function createLegacyAdminTeam(
  name: string,
): Promise<ApiResult<null>> {
  return await supabase.from("teams").insert({ name });
}
