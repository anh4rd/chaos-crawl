import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { Player } from "../../types/database";

const initialData: Player[] = [];
const load = (signal: AbortSignal) =>
  supabase.from("players").select("*").abortSignal(signal);

export function usePlayers() {
  return useRealtimeQuery("players", load, initialData);
}
