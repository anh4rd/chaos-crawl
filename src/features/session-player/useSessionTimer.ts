import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/sessionSupabase";
import type { PlayerPage, SessionStatus, SharedGameTimer } from "./types";

export function useSessionTimer(
  sessionId: string | undefined,
  status: SessionStatus | undefined,
  activePage: PlayerPage,
) {
  const [sharedTimer, setSharedTimer] = useState<SharedGameTimer | null>(null);
  const [sharedTimerError, setSharedTimerError] = useState("");
  const [timerReceivedAt, setTimerReceivedAt] = useState<number | null>(null);
  const [timerNow, setTimerNow] = useState(() => performance.now());
  const sharedTimerSnapshotKey = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId || status !== "live" || activePage !== "game") {
      setSharedTimer(null);
      setSharedTimerError("");
      setTimerReceivedAt(null);
      sharedTimerSnapshotKey.current = null;
      return;
    }
    let mounted = true;
    let requestId = 0;
    let latestAppliedRequestId = 0;
    const refreshTimer = async () => {
      const currentRequestId = ++requestId;
      const { data, error: timerError } = await supabase
        .from("cc_game_session_timers")
        .select(
          "session_id,round_number,remaining_seconds,is_running,is_on_break,resume_round_number,break_ends_at,updated_at",
        )
        .eq("session_id", sessionId)
        .maybeSingle();
      if (!mounted || currentRequestId < latestAppliedRequestId) return;
      latestAppliedRequestId = currentRequestId;
      if (timerError) {
        setSharedTimerError(
          "The shared timer is unavailable. Please ask the host to check the live timer connection.",
        );
        return;
      }
      setSharedTimerError("");
      const nextTimer = (data as SharedGameTimer | null) ?? null;
      const nextSnapshotKey = nextTimer
        ? [
            sessionId,
            nextTimer.updated_at,
            nextTimer.round_number,
            nextTimer.remaining_seconds,
            nextTimer.is_running,
            nextTimer.is_on_break,
            nextTimer.resume_round_number,
            nextTimer.break_ends_at,
          ].join(":")
        : null;
      if (nextSnapshotKey === sharedTimerSnapshotKey.current) return;
      sharedTimerSnapshotKey.current = nextSnapshotKey;
      const receivedAt = performance.now();
      setSharedTimer(nextTimer);
      setTimerReceivedAt(nextTimer ? receivedAt : null);
      setTimerNow(receivedAt);
    };
    void refreshTimer();
    const interval = window.setInterval(() => void refreshTimer(), 2000);
    const timerChannel = supabase
      .channel(`game-session-timer-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cc_game_session_timers",
          filter: `session_id=eq.${sessionId}`,
        },
        () => void refreshTimer(),
      )
      .subscribe();
    return () => {
      mounted = false;
      window.clearInterval(interval);
      void supabase.removeChannel(timerChannel);
    };
  }, [activePage, sessionId, status]);

  useEffect(() => {
    if (!sharedTimer?.is_running) return;
    const interval = window.setInterval(
      () => setTimerNow(performance.now()),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [sharedTimer?.is_running]);

  return { sharedTimer, sharedTimerError, timerReceivedAt, timerNow };
}
