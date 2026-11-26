import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type {
  PlatformGame,
  PlatformGameDetail,
  PlatformSessionPlayers,
} from "../types/superAdmin";

export function readPlatformGames(): PromiseLike<ApiResult<PlatformGame[]>> {
  return runApi<PlatformGame[]>(() =>
    supabase.rpc("cc_super_admin_list_games"),
  );
}

export function readPlatformGameDetail(
  id: string,
): PromiseLike<ApiResult<PlatformGameDetail>> {
  return runApi<PlatformGameDetail>(() =>
    supabase.rpc("cc_super_admin_game_detail", { p_game_id: id }),
  );
}

export function readPlatformSessionPlayers(sessionId: string) {
  return runApi<PlatformSessionPlayers>(() =>
    supabase.rpc("cc_super_admin_session_players", { p_session_id: sessionId }),
  );
}
