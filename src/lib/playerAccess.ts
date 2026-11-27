import { supabase } from "./sessionSupabase";
import type { JoinResult } from "../types/playerAccess";

export function joinGameSession(parameters: {
  action: "register" | "recover";
  join_code: string;
  credential: string;
  name?: string;
  mobile?: string;
}): PromiseLike<{ data: JoinResult | null; error: unknown }> {
  return supabase.functions.invoke("player-identity", { body: parameters });
}
