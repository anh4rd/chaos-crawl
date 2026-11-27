import { supabase } from "../../lib/supabase";
import type { Team } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";

const empty: Team[] = [];
const load = (signal: AbortSignal) =>
  supabase
    .from("teams")
    .select("id, name, avatar_url")
    .order("name")
    .abortSignal(signal);
export function useTeams() {
  return useRealtimeQuery("teams", load, empty);
}
