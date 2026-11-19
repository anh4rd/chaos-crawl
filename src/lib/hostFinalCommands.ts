import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function hostManageSessionFinalRound(parameters: {
  p_session_id: string;
  p_gallery_open: boolean;
  p_voting_open: boolean;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_manage_session_final_round", parameters),
  );
}

export function hostAdvanceSessionFinalRoundChallenge(parameters: {
  p_session_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_advance_session_final_round_challenge", parameters),
  );
}

export function hostReopenSessionFinalRoundChallenge(parameters: {
  p_session_id: string;
  p_challenge_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_reopen_session_final_round_challenge", parameters),
  );
}

export function hostSelectSessionFinalRoundChallenge(parameters: {
  p_session_id: string;
  p_challenge_id: string;
  p_evidence_id: string | null;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_select_session_final_round_challenge", parameters),
  );
}

export function hostSetSessionFinalSlideshow(parameters: {
  p_session_id: string;
  p_challenge_id: string;
  p_evidence_id: string | null;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_set_session_final_slideshow", parameters),
  );
}
