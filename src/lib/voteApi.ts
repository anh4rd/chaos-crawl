import { supabase } from "./supabase";

export async function submitVote(
  voterId: string,
  votedForPlayerId: string,
  challengeName: string
) {
  return await supabase
    .from("votes")
    .insert({
      voter_id: voterId,
      voted_for_player_id: votedForPlayerId,
      challenge_name: challengeName,
    });
}

export async function getMyVote(
  voterId: string,
  challengeName: string
) {
  return await supabase
    .from("votes")
    .select("*")
    .eq("voter_id", voterId)
    .eq("challenge_name", challengeName)
    .maybeSingle();
}

export async function getVotesForChallenge(
  challengeName: string
) {
  return await supabase
    .from("votes")
    .select("*")
    .eq("challenge_name", challengeName);
}