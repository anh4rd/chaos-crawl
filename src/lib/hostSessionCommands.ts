import type { PlannedTaskInfo } from "../features/host-live/types";
import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function hostStartGameSession(parameters: {
  p_session_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_start_game_session", parameters),
  );
}

export function hostSetGameSessionRound(parameters: {
  p_session_id: string;
  p_round_number: number;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_set_game_session_round", parameters),
  );
}

export function writeSharedTimer(values: {
  session_id: string;
  round_number: number;
  remaining_seconds: number;
  is_running: boolean;
  is_on_break: boolean;
  resume_round_number: number | null;
  break_ends_at: string | null;
  updated_at: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_game_session_timers")
      .upsert(values, { onConflict: "session_id" }),
  );
}

export function hostCompleteGameSession(parameters: {
  p_session_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_complete_game_session", parameters),
  );
}

export function readOwnedHostPlan(
  hostGameId: string,
  hostId: string,
): Promise<ApiResult<{ plan_data: unknown }>> {
  return runApi<{ plan_data: unknown }>(() =>
    supabase
      .from("host_games")
      .select("plan_data")
      .eq("id", hostGameId)
      .eq("host_id", hostId)
      .maybeSingle(),
  );
}

export function saveBreakChallenge(
  values: {
    title: string;
    description: string;
    duration_minutes: number;
    points: number;
    allow_photo_upload: boolean;
  },
  challengeId: string,
  sessionId: string,
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_game_session_challenges")
      .update(values)
      .eq("id", challengeId)
      .eq("session_id", sessionId),
  );
}

export function readHostPlan(
  hostGameId: string,
): Promise<ApiResult<{ plan_data: unknown }>> {
  return runApi<{ plan_data: unknown }>(() =>
    supabase
      .from("host_games")
      .select("plan_data")
      .eq("id", hostGameId)
      .maybeSingle(),
  );
}

export function saveHostPlanTasks(
  values: {
    plan_data: {
      selectedTasks: (
        | PlannedTaskInfo
        | {
            title: string;
            description: string;
            minutes: number;
            points: number;
            equipment: string[];
            hostGameId?: string;
            setup?: string;
            prep?: string;
          }
      )[];
    };
  },
  hostGameId: string,
  hostId: string,
): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("host_games")
      .update(values)
      .eq("id", hostGameId)
      .eq("host_id", hostId),
  );
}
