import {
  supabase,
} from "././supabase";

export type ChallengeType =
  | "main"
  | "side"
  | "bonus";

interface CompleteChallengeArgs {
  playerId: string;
  challengeType: ChallengeType;
  challengeId: string | number;
  points: number;
  photoId?: string | number | null;
}

export async function completeChallenge({
  playerId,
  challengeType,
  challengeId,
  points,
  photoId = null,
}: CompleteChallengeArgs) {
  // First check whether this player
  // already completed this challenge
  const {
    data: existing,
    error: checkError,
  } = await supabase
    .from("challenge_completions")
    .select("id")
    .eq("player_id", playerId)
    .eq(
      "challenge_type",
      challengeType
    )
    .eq(
      "challenge_id",
      String(challengeId)
    )
    .maybeSingle();

  if (checkError) {
    return {
      data: null,
      error: checkError,
    };
  }

  if (existing) {
    return {
      data: existing,
      error: {
        code: "ALREADY_COMPLETED",
        message:
          "You already completed this challenge.",
      },
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("challenge_completions")
    .insert({
      player_id: playerId,

      // Exact typo from your database
      challenge_type:
        challengeType,

      challenge_id:
        String(challengeId),

      points,

      photo_id:
        photoId ?? null,
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error,
    };
  }

  return {
    data,
    error: null,
  };
}

export async function removeChallengeCompletion(
  playerId: string,
  challengeType: ChallengeType,
  challengeId: string | number
) {
  return supabase
    .from("challenge_completions")
    .delete()
    .eq("player_id", playerId)
    .eq(
      "challenge_type",
      challengeType
    )
    .eq(
      "challenge_id",
      String(challengeId)
    );
}