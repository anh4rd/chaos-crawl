import type { RewardMethod, RewardTargetKind } from "../types/hostSession";

import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function hostStartSessionRewardRound(parameters: {
  p_session_id: string;
  p_challenge_id: string;
  p_reward_method: RewardMethod;
  p_target_kind: RewardTargetKind;
  p_points: number;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_start_session_reward_round", parameters),
  );
}

export function hostCompleteSessionRewardRound(parameters: {
  p_reward_round_id: string;
  p_winner_player_ids: string[];
  p_winner_team_ids: string[];
  p_points: number | null;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_complete_session_reward_round", parameters),
  );
}

export function hostReleaseSessionRewardRound(parameters: {
  p_reward_round_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_release_session_reward_round", parameters),
  );
}

export function hostCancelSessionRewardRound(parameters: {
  p_reward_round_id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_cancel_session_reward_round", parameters),
  );
}
