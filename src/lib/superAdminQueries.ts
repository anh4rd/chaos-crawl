import type { ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type { PlatformGame, PlatformGameDetail } from "../types/superAdmin";

export function readPlatformGames(): PromiseLike<ApiResult<PlatformGame[]>> {
  return supabase.rpc("cc_super_admin_list_games");
}

export function readPlatformGameDetail(
  id: string,
): PromiseLike<ApiResult<PlatformGameDetail>> {
  return supabase.rpc("cc_super_admin_game_detail", { p_game_id: id });
}
