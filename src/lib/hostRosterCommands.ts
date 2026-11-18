import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function updateHostParticipation(
  values: { host_participates: boolean },
  sessionId: string,
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.from("cc_game_sessions").update(values).eq("id", sessionId),
  );
}

export function hostJoinAsPlayer(parameters: {
  p_session_id: string;
  p_player_name: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_join_as_player", parameters),
  );
}

export function uploadHostAvatar(
  storagePath: string,
  file: File,
  options: { upsert: true; contentType: string },
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.storage.from("game-assets").upload(storagePath, file, options),
  );
}

export function readHostPlayerIdentity(
  sessionId: string,
): Promise<ApiResult<{ host_player_id: string | null }>> {
  return runApi<{ host_player_id: string | null }>(() =>
    supabase
      .from("cc_game_sessions")
      .select("host_player_id")
      .eq("id", sessionId)
      .maybeSingle(),
  );
}

export function updateHostAvatar({
  values,
  playerId,
  sessionId,
}: {
  values: { avatar_url: string };
  playerId: string;
  sessionId: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_game_session_players")
      .update(values)
      .eq("id", playerId)
      .eq("session_id", sessionId),
  );
}

export function updateTeamCapacity(
  values: { team_size: number },
  sessionId: string,
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.from("cc_game_sessions").update(values).eq("id", sessionId),
  );
}

export function disableHostParticipation(
  values: { host_participates: false },
  sessionId: string,
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.from("cc_game_sessions").update(values).eq("id", sessionId),
  );
}

export function insertSessionTeam(values: {
  session_id: string;
  name: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.from("cc_game_session_teams").insert(values),
  );
}

export function renameSessionTeam({
  values,
  teamId,
  sessionId,
}: {
  values: { name: string };
  teamId: string;
  sessionId: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_game_session_teams")
      .update(values)
      .eq("id", teamId)
      .eq("session_id", sessionId),
  );
}

export function uploadTeamImage(
  storagePath: string,
  file: File,
  options: { upsert: true; contentType: string },
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.storage.from("game-assets").upload(storagePath, file, options),
  );
}

export function saveTeamPhoto({
  values,
  hostGameId,
  hostId,
}: {
  values: { plan_data: { teamPhotoUrls: { [x: string]: string } } };
  hostGameId: string;
  hostId: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("host_games")
      .update(values)
      .eq("id", hostGameId)
      .eq("host_id", hostId),
  );
}

export function assignSessionTeam({
  values,
  playerId,
  sessionId,
}: {
  values: { team_id: string | null };
  playerId: string;
  sessionId: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_game_session_players")
      .update(values)
      .eq("id", playerId)
      .eq("session_id", sessionId),
  );
}
