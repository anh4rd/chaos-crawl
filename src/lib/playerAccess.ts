import { supabase } from "./sessionSupabase";
import type { JoinResult } from "../types/playerAccess";

export function joinGameSession(parameters: {
  p_join_code: string;
  p_name: string | null;
  p_mobile: string;
}): PromiseLike<{ data: JoinResult | null; error: unknown }> {
  return supabase.rpc("cc_join_game_session", parameters);
}
