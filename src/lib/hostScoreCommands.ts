import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function adjustSessionScore(parameters: {
  p_session_id: string;
  p_target_kind: "player" | "team";
  p_target_id: string;
  p_delta: number;
}): Promise<ApiResult<null>> {
  return runApi<null>(() =>
    supabase.rpc("cc_host_adjust_session_score", parameters),
  );
}
