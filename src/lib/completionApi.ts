import {
  supabase,
} from "./supabase";

export type ChallengeType =
  | "main"
  | "side"
  | "bonus";

export interface CompleteChallengeArgs {
  playerId: string;
  challengeType: ChallengeType;
  challengeId: string | number;
  points: number;
  photoId?: string | number | null;
}

export interface ChallengeCompletion {
  id: string | number;
  player_id: string;
  challenge_type: ChallengeType;
  challenge_id: string;
  points: number;
  photo_id: string | number | null;
  completed_at?: string | null;
}

export async function completeChallenge({
  playerId,
  challengeType,
  challengeId,
  points,
  photoId = null,
}: CompleteChallengeArgs) {
  const {
    data: existing,
    error: checkError,
  } = await supabase
    .from("challenge_completions")
    .select("*")
    .eq(
      "player_id",
      playerId
    )
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
    console.error(
      "CHECK COMPLETION ERROR:",
      checkError
    );

    return {
      data: null,
      error: checkError,
    };
  }

  if (existing) {
    return {
      data:
        existing as ChallengeCompletion,

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
      player_id:
        playerId,

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
    console.error(
      "CREATE COMPLETION ERROR:",
      error
    );

    return {
      data: null,
      error,
    };
  }

  return {
    data:
      data as ChallengeCompletion,

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
    .eq(
      "player_id",
      playerId
    )
    .eq(
      "challenge_type",
      challengeType
    )
    .eq(
      "challenge_id",
      String(challengeId)
    );
}

export async function getChallengeCompletions() {
  const {
    data,
    error,
  } = await supabase
    .from("challenge_completions")
    .select("*")
    .order(
      "completed_at",
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      "LOAD COMPLETIONS ERROR:",
      error
    );

    return {
      data: [],
      error,
    };
  }

  return {
    data:
      (data ?? []) as ChallengeCompletion[],

    error: null,
  };
}

export async function updateCompletionPoints(
  completionId: string | number,
  points: number
) {
  return supabase
    .from("challenge_completions")
    .update({
      points,
    })
    .eq(
      "id",
      completionId
    )
    .select()
    .single();
}