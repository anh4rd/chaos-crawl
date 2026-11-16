import { supabase } from "./supabase";
import { invalidResult, runApi, type ApiResult } from "./apiResult";
import type { ChallengeType, ChallengeCompletion } from "../types/database";
export type { ChallengeType, ChallengeCompletion } from "../types/database";

export interface CompleteChallengeArgs {
  playerId: string;
  challengeType: ChallengeType;
  challengeId: string | number;
  points: number;
  photoId?: string | number | null;
}

const alreadyCompleted = {
  code: "ALREADY_COMPLETED",
  message: "You already completed this challenge.",
};

export async function completeChallenge({
  playerId,
  challengeType,
  challengeId,
  points,
  photoId = null,
}: CompleteChallengeArgs): Promise<ApiResult<ChallengeCompletion>> {
  if (
    !playerId.trim() ||
    !String(challengeId).trim() ||
    !Number.isFinite(points) ||
    !["main", "side", "bonus"].includes(challengeType)
  ) {
    return invalidResult(
      "A player, valid challenge and finite points are required.",
    );
  }
  const existing = await runApi<ChallengeCompletion>(() =>
    supabase
      .from("challenge_completions")
      .select("*")
      .eq("player_id", playerId)
      .eq("challenge_type", challengeType)
      .eq("challenge_id", String(challengeId))
      .maybeSingle(),
  );
  if (existing.error) return existing;
  if (existing.data) return { data: existing.data, error: alreadyCompleted };

  const result = await runApi<ChallengeCompletion>(() =>
    supabase
      .from("challenge_completions")
      .insert({
        player_id: playerId,
        challenge_type: challengeType,
        challenge_id: String(challengeId),
        points,
        photo_id: photoId,
      })
      .select()
      .single(),
  );
  // A uniqueness constraint, if installed, closes the check/insert race. Do not
  // label unrelated unique violations (for example photo_id) as a completion.
  if (result.error?.code === "23505") {
    const duplicate = await runApi<ChallengeCompletion>(() =>
      supabase
        .from("challenge_completions")
        .select("*")
        .eq("player_id", playerId)
        .eq("challenge_type", challengeType)
        .eq("challenge_id", String(challengeId))
        .maybeSingle(),
    );
    if (duplicate.data)
      return { data: duplicate.data, error: alreadyCompleted };
  }
  return result;
}

export function removeChallengeCompletion(
  playerId: string,
  challengeType: ChallengeType,
  challengeId: string | number,
): Promise<ApiResult<null>> {
  return runApi<null>(() =>
    supabase
      .from("challenge_completions")
      .delete()
      .eq("player_id", playerId)
      .eq("challenge_type", challengeType)
      .eq("challenge_id", String(challengeId)),
  );
}

export function getChallengeCompletions(
  signal?: AbortSignal,
): Promise<ApiResult<ChallengeCompletion[]>> {
  return runApi<ChallengeCompletion[]>(() => {
    const query = supabase
      .from("challenge_completions")
      .select("*")
      .order("completed_at", { ascending: false });
    return signal ? query.abortSignal(signal) : query;
  });
}

export function updateCompletionPoints(
  completionId: string | number,
  points: number,
): Promise<ApiResult<ChallengeCompletion>> {
  if (!Number.isFinite(points) || !String(completionId).trim()) {
    return Promise.resolve(
      invalidResult("A completion and finite points are required."),
    );
  }
  return runApi<ChallengeCompletion>(() =>
    supabase
      .from("challenge_completions")
      .update({ points })
      .eq("id", completionId)
      .select()
      .single(),
  );
}
