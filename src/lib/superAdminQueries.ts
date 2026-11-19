import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type { PlatformGame, PlatformGameDetail } from "../types/superAdmin";

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
