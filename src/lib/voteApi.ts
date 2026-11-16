import { supabase } from "./supabase";
import { invalidResult, runApi, type ApiResult } from "./apiResult";

import type { Vote, Player } from "../types/database";

export function submitVote(
  voterId: string,
  challengeName: string,
  target: { playerId?: string; teamId?: string },
  signal?: AbortSignal,
): Promise<ApiResult<null>> {
  const playerId = target.playerId?.trim() || null;
  const teamId = target.teamId?.trim() || null;
  if (
    !voterId.trim() ||
    !challengeName.trim() ||
    Boolean(playerId) === Boolean(teamId)
  ) {
    return Promise.resolve(
      invalidResult(
        "A voter, challenge and exactly one vote target are required.",
      ),
    );
  }
  return runApi<null>(() => {
    const query = supabase.from("votes").insert({
      voter_id: voterId,
      voted_for_player_id: playerId,
      voted_for_team_id: teamId,
      challenge_name: challengeName,
    });
    return signal ? query.abortSignal(signal) : query;
  });
}

export function getMyVote(
  voterId: string,
  challengeName: string,
): Promise<ApiResult<Vote>> {
  return runApi<Vote>(() =>
    supabase
      .from("votes")
      .select("*")
      .eq("voter_id", voterId)
      .eq("challenge_name", challengeName)
      .maybeSingle(),
  );
}

export function getVotesForChallenge(
  challengeName: string,
): Promise<ApiResult<Vote[]>> {
  return runApi<Vote[]>(() =>
    supabase.from("votes").select("*").eq("challenge_name", challengeName),
  );
}

export type VoteSubmission = {
  status: "voted" | "voter-missing" | "cancelled";
};

async function findVoter(voterId: string, signal?: AbortSignal) {
  const result = await runApi<Pick<Player, "id">>(() => {
    const query = supabase.from("players").select("id").eq("id", voterId);
    return (signal ? query.abortSignal(signal) : query).maybeSingle();
  });
  if (result.error)
    return {
      data: null,
      error: {
        ...result.error,
        message: `Could not verify your player session: ${result.error.message}`,
      },
    };
  return result;
}

// Existence checks improve local recovery; they are not authentication or proof
// of ownership of the saved player ID. Authorization still belongs in policies.
export async function castVote(
  voterId: string,
  challengeName: string,
  target: { playerId?: string; teamId?: string },
  signal?: AbortSignal,
): Promise<ApiResult<VoteSubmission>> {
  if (signal?.aborted) return { data: { status: "cancelled" }, error: null };
  const voter = await findVoter(voterId, signal);
  if (signal?.aborted) return { data: { status: "cancelled" }, error: null };
  if (voter.error) return { data: null, error: voter.error };
  if (!voter.data) return { data: { status: "voter-missing" }, error: null };
  const result = await submitVote(voterId, challengeName, target, signal);
  if (!result.error || result.error.code === "23505")
    return { data: { status: "voted" }, error: null };
  if (result.error.code !== "23503") return { data: null, error: result.error };
  // A foreign-key error may name the target, not the voter. Recheck before the
  // caller discards a valid saved session; a failed lookup is not nonexistence.
  const current = await findVoter(voterId, signal);
  if (current.error) return { data: null, error: current.error };
  if (!current.data) return { data: { status: "voter-missing" }, error: null };
  return {
    data: null,
    error: {
      code: "VOTE_TARGET_UNAVAILABLE",
      message:
        "The selected player or team is no longer available. Choose again and retry.",
    },
  };
}
