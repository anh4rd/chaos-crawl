import { supabase } from "../../lib/supabase";
import type { Media } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { Media } from "../../types/database";

const initialData: Media[] = [];
const load = (signal: AbortSignal) =>
  supabase
    .from("photos")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .abortSignal(signal);

export function useMedia() {
  return useRealtimeQuery("photos", load, initialData);
}
