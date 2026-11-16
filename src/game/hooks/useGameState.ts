import { useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { GameState } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
import { useScheduledReveal } from "./useScheduledReveal";
export type { GameState } from "../../types/database";

const load = (signal: AbortSignal) =>
  supabase
    .from("game_state")
    .select("*")
    .eq("id", 1)
    .abortSignal(signal)
    .single();
export function useGameState() {
  const state = useRealtimeQuery<GameState | null>("game_state", load, null);
  const { error: scheduleError, retry } = useScheduledReveal(state.data);
  const refresh = state.reload;
  const reload = useCallback(async () => {
    retry();
    await refresh();
  }, [retry, refresh]);
  return { ...state, error: state.error ?? scheduleError, reload };
}
