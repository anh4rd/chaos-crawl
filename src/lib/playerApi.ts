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
  const { data: player, error } = await supabase
    .from("players")
    .select("score")
    .eq("id", playerId)
    .single();

  if (error || !player) return;

  await supabase
    .from("players")
    .update({
      score: player.score + points,
    })
    .eq("id", playerId)
    .select();
}

export async function renamePlayer(
  id: string,
  name: string
) {
  return await supabase
    .from("players")
    .update({ name })
    .eq("id", id);
}

export async function deletePlayer(
  id: string
) {
  return await supabase
    .from("players")
    .delete()
    .eq("id", id);
}

export async function changeTeam(
  id: string,
  team: string
) {
  return await supabase
    .from("players")
    .update({
      team,
    })
    .eq("id", id);
}

export async function removePoints(
  id: string,
  amount: number
) {
  const { data } = await supabase
    .from("players")
    .select("score")
    .eq("id", id)
    .single();

  if (!data) return;

  await supabase
    .from("players")
    .update({
      score: Math.max(0, data.score - amount),
    })
    .eq("id", id);
}
