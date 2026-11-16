import { supabase } from "../../lib/supabase";
import type { SideChallenge } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { SideChallenge } from "../../types/database";

const initialData: SideChallenge[] = [];
const load = (signal: AbortSignal) =>
  supabase
    .from("side_challenges")
    .select("*")
    .eq("active", true)
    .order("id", { ascending: true })
    .abortSignal(signal);

export default function useSideChallenges() {
  return useRealtimeQuery("side_challenges", load, initialData);
}
