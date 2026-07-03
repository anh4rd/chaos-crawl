import { supabase } from "./supabase";

export async function submitVote(
  challengeId: number,
  photoId: number,
  playerId: string
) {
  return await supabase
    .from("votes")
    .insert({
      challenge_id: challengeId,
      photo_id: photoId,
      voter_id: playerId,
    });
}
