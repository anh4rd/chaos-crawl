import { runApi } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function addGameCohost(hostGameId: string, email: string) {
  return runApi<unknown>(() =>
    supabase.rpc("cc_add_game_cohost", {
      p_host_game_id: hostGameId,
      p_email: email,
    }),
  );
}

export function removeGameCohost(hostGameId: string, userId: string) {
  return runApi<unknown>(() =>
    supabase.rpc("cc_remove_game_cohost", {
      p_host_game_id: hostGameId,
      p_user_id: userId,
    }),
  );
}
