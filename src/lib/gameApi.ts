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
  current_challenge_id?: number | null;
  current_challenge_order?: number;
  challenge_description?: string;
  voting_open?: boolean;
  voting_target?: "player" | "team";
  show_vote_results?: boolean;
  slideshow_open?: boolean;
}) {
  return await supabase
    .from("game_state")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
}