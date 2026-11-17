import { supabase } from "../../lib/supabase";
import type { Challenge } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { Challenge } from "../../types/database";

const initialData: Challenge[] = [];
const load = (signal: AbortSignal) =>
  supabase
    .from("challenges")
    .select("*")
    .order("reveal_order", { ascending: true })
    .abortSignal(signal);

export function useChallenges() {
  return useRealtimeQuery("challenges", load, initialData);
}
