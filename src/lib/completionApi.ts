import { supabase } from "./supabase";

export type ChallengeType =
  | "main"
  | "side"
  | "bonus";

export interface ChallengeCompletion {
  id: number;
  player_id: string;
  challenge_type: ChallengeType;
  challenge_id: string;
  challenge_title: string;
  points: number;
  photo_id: string | null;
  completed_at: string;
}

export async function completeChallenge(details: {
  playerId: string;
  challengeType: ChallengeType;
  challengeId: string | number;
  challengeTitle: string;
  points: number;
  photoId?: string | null;
}) {
  return await supabase
    .from("challenge_completions")
    .upsert(
      {
        player_id: details.playerId,
        challenge_type: details.challengeType,
        challenge_id: String(details.challengeId),
        challenge_title: details.challengeTitle,
        points: details.points,
        photo_id: details.photoId ?? null,
      },
      {
        onConflict:
          "player_id,challenge_type,challenge_id",
      }
    )
    .select()
    .single();
}

export async function removeCompletion(
  playerId: string,
  challengeType: ChallengeType,
  challengeId: string | number
) {
  return await supabase
    .from("challenge_completions")
    .delete()
    .eq("player_id", playerId)
    .eq("challenge_type", challengeType)
    .eq("challenge_id", String(challengeId));
}
