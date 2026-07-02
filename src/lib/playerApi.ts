import { supabase } from "./supabase";

export async function createPlayer(name: string, team: string) {
  const result = await supabase
    .from("players")
    .insert({
      name,
      team,
      score: 0,
    })
    .select();

  console.log("CREATE PLAYER RESULT", result);

  return result;
}