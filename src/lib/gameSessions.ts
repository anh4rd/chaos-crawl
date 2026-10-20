import { supabase } from "./supabase";

export interface HostSessionLaunch {
  id: string;
  join_code: string;
  status: "lobby" | "live" | "completed";
  existing?: boolean;
  round_count?: number;
}

/**
 * Creates a session from a saved Host Hub plan, or returns that plan's current
 * lobby/live session if it has already been launched. The database function
 * creates session-scoped data only; it does not write into legacy game tables.
 */
export async function createOrGetHostGameSession(hostGameId: string): Promise<HostSessionLaunch> {
  const { data, error } = await supabase.rpc("cc_host_create_game_session", {
    p_host_game_id: hostGameId,
  });

  if (error) {
    throw new Error(error.message || "Couldn't create the game session.");
  }

  const result = (Array.isArray(data) ? data[0] : data) as HostSessionLaunch | null;
  if (!result?.id || !result.join_code) {
    throw new Error("Supabase did not return a session ID and join code.");
  }
  return result;
}
