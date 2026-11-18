import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function insertSecretChallenge(values: {
  session_id: string;
  kind: string;
  round_number: null;
  title: string;
  description: string;
  points: number;
  duration_minutes: number;
  sort_order: number;
  allow_photo_upload: boolean;
}): Promise<ApiResult<{ id: string }>> {
  return runApi<{ id: string }>(() =>
    supabase
      .from("cc_game_session_challenges")
      .insert(values)
      .select("id")
      .single(),
  );
}

export function hostAssignSecretMission(parameters: {
  p_session_id: string;
  p_player_id: string;
  p_challenge_id: string;
  p_scheduled_at: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_assign_secret_mission", parameters),
  );
}

export function hostSelectSecretReviewAssignment(parameters: {
  p_session_id: string;
  p_assignment_id: string;
  p_evidence_id: string | null;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_select_secret_review_assignment", parameters),
  );
}

export function hostOpenSecretReview(parameters: {
  p_session_id: string;
  p_assignment_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_open_secret_review", parameters),
  );
}

export function hostReopenSecretReview(parameters: {
  p_session_id: string;
  p_assignment_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_reopen_secret_review", parameters),
  );
}

export function hostCloseSecretReviewVote(parameters: {
  p_session_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_close_secret_review_vote", parameters),
  );
}

export function hostAdvanceSecretReview(parameters: {
  p_session_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_advance_secret_review", parameters),
  );
}

export function hostSetSecretReviewEvidence(parameters: {
  p_session_id: string;
  p_evidence_id: string | null;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_set_secret_review_evidence", parameters),
  );
}

export function hostDispatchDueSecretMissions(parameters: {
  p_session_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi(() =>
    supabase.rpc("cc_host_dispatch_due_secret_missions", parameters),
  );
}
