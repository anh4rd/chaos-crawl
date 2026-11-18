import { supabase } from "./supabase";
import { runApi, type ApiResult } from "./apiResult";

// Keep minimal write responses and existing stored team names for this legacy flow.
export async function createLegacyHostTeam(
  name: string,
): Promise<ApiResult<null>> {
  return runApi<null>(() => supabase.from("teams").insert({ name }));
}
export async function createLegacyHostPlayer(
  name: string,
): Promise<ApiResult<null>> {
  return runApi<null>(() =>
    supabase.from("players").insert({ name, team: null, score: 0 }),
  );
}
export async function assignLegacyHostTeam(
  playerId: string,
  team: string,
): Promise<ApiResult<null>> {
  return runApi<null>(() =>
    supabase
      .from("players")
      .update({ team: team || null })
      .eq("id", playerId),
  );
}
