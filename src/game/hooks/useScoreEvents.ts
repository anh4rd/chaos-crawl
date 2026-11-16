import { supabase } from "../../lib/supabase";
import type { ScoreEvent } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { ScoreEvent } from "../../types/database";

const initialData: ScoreEvent[] = [];
const load = (signal: AbortSignal) =>
  supabase
    .from("score_events")
    .select("*")
    .order("awarded_at", { ascending: false })
    .abortSignal(signal);

export function useScoreEvents() {
  return useRealtimeQuery("score_events", load, initialData);
}
