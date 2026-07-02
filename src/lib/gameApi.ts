import { supabase } from "./supabase";

export async function getGameState() {
  return await supabase
    .from("game_state")
    .select("*")
    .eq("id", 1)
    .single();
}

export async function updateGameState(values: {
  current_pub?: string;
  current_challenge?: string;
  challenge_description?: string;
  broadcast_message?: string;
}) {
  return await supabase
    .from("game_state")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
}