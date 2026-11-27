import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function playerCastSessionRewardVote(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_reward_round_id: string;
  p_target_player_id: string | null;
  p_target_team_id: string | null;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_cast_session_reward_vote", parameters),
  );
}

export function playerCastSessionFinalRoundVote(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_evidence_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_cast_session_final_round_vote", parameters),
  );
}

export function playerChooseSessionTeam(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_team_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_choose_session_team", parameters),
  );
}

export function playerCreateSessionTeam(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_team_name: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_create_session_team", parameters),
  );
}

export function playerSubmitSessionChallenge(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_challenge_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_submit_session_challenge", parameters),
  );
}

export function playerSubmitSecretMission(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_assignment_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_submit_secret_mission", parameters),
  );
}

export function playerSubmitSecretText(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_assignment_id: string;
  p_answer: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_submit_secret_text", parameters),
  );
}

export function playerCastSecretReviewVote(parameters: {
  p_join_code: string;
  p_player_token: string;
  p_assignment_id: string;
  p_vote: "success" | "fail";
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_player_cast_secret_review_vote", parameters),
  );
}
