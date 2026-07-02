import { supabase } from "./supabase";

export async function getGame() {
  const { data, error } = await supabase
    .from("game")
    .select("*")
    .eq("id", 1)
    .single();

  return { data, error };
}

export async function updateGame(values: {
  current_pub?: string;
  current_challenge?: string;
  challenge_description?: string;
  broadcast?: string;
}) {
  return await supabase
    .from("game")
    .update(values)
    .eq("id", 1);
}
