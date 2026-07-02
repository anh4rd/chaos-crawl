import { supabase } from "./supabase";

export async function createPlayer(name: string, team: string) {
  return await supabase
    .from("players")
    .insert({
      name,
      team,
      score: 0,
    })
    .select()
    .single();
}

export async function addPoints(
  playerId: string,
  points: number
) {
  console.log("Adding points", playerId, points);

  const { data: player, error } = await supabase
    .from("players")
    .select("score")
    .eq("id", playerId)
    .single();

  console.log("Player:", player);
  console.log("Error:", error);

  if (error || !player) return;

  const result = await supabase
    .from("players")
    .update({
      score: player.score + points,
    })
    .eq("id", playerId)
    .select();

  console.log("Update result:", result);
}