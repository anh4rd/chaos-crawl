import { invalidResult, runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export interface SessionTeamAdjustment {
  team_id: string;
  adjustment: number;
}

export async function readSessionTeamAdjustments(
  joinCode: string,
  playerToken: string,
): Promise<ApiResult<SessionTeamAdjustment[]>> {
  const result = await runApi<unknown>(() =>
    supabase.rpc("cc_get_session_team_adjustments", {
      p_join_code: joinCode,
      p_player_token: playerToken,
    }),
  );
  if (result.error) return { data: null, error: result.error };
  if (
    !Array.isArray(result.data) ||
    !result.data.every(
      (row: unknown) =>
        typeof row === "object" &&
        row !== null &&
        "team_id" in row &&
        typeof row.team_id === "string" &&
        "adjustment" in row &&
        typeof row.adjustment === "number" &&
        Number.isSafeInteger(row.adjustment),
    )
  )
    return invalidResult("The server returned invalid team score adjustments.");
  return { data: result.data, error: null };
}
