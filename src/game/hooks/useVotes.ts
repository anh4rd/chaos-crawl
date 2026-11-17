import { useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Vote } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";

const empty: Vote[] = [];
export function useVotes(challenge: string | undefined) {
  const load = useCallback(
    (signal: AbortSignal) =>
      challenge
        ? supabase
            .from("votes")
            .select("*")
            .eq("challenge_name", challenge)
            .abortSignal(signal)
        : Promise.resolve({ data: empty, error: null }),
    [challenge],
  );
  return useRealtimeQuery(
    "votes",
    load,
    empty,
    JSON.stringify([challenge ?? null]),
  );
}
