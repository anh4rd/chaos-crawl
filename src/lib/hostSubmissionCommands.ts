import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function hostReviewSessionSubmission(parameters: {
  p_submission_id: string;
  p_approve: boolean;
  p_points: number;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.rpc("cc_host_review_session_submission", parameters),
  );
}
