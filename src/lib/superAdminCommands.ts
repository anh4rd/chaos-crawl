import { runApi } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type { PlatformPlayerUpdate } from "../types/superAdmin";

export function updatePlatformPlayer(
  sessionId: string,
  playerId: string,
  values: PlatformPlayerUpdate,
  expected: PlatformPlayerUpdate,
) {
  return runApi<null>(() =>
    supabase.rpc("cc_super_admin_update_session_player", {
      p_session_id: sessionId,
      p_player_id: playerId,
      p_name: values.name,
      p_avatar_url: values.avatar_url,
      p_team_id: values.team_id,
      p_score: values.score,
      p_phone: values.phone,
      p_expected: expected,
    }),
  );
}
