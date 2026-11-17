import { supabase } from "../../lib/supabase";
import type { Pub } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { Pub } from "../../types/database";

const initialData: Pub[] = [];
const load = (signal: AbortSignal) =>
  supabase
    .from("pubs")
    .select("*")
    .order("sort_order", { ascending: true })
    .abortSignal(signal);

export function usePubs() {
  return useRealtimeQuery("pubs", load, initialData);
}
