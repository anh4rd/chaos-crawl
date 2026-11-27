import { invalidResult, runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export interface SessionPortraits {
  players: Record<string, string>;
  teams: Record<string, string>;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

export async function readSessionPortraits(
  joinCode: string,
  playerToken: string,
): Promise<ApiResult<SessionPortraits>> {
  const result = await runApi<unknown>(() =>
    supabase.rpc("cc_get_session_portraits", {
      p_join_code: joinCode,
      p_player_token: playerToken,
    }),
  );
  if (result.error) return { data: null, error: result.error };
  const value = result.data;
  if (
    typeof value !== "object" ||
    value === null ||
    !("players" in value) ||
    !("teams" in value) ||
    !isStringRecord(value.players) ||
    !isStringRecord(value.teams)
  )
    return invalidResult("The server returned invalid player or team photos.");
  return { data: { players: value.players, teams: value.teams }, error: null };
}
