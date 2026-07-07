import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

import {
  type ScoreEvent,
} from "../../lib/scoreApi";

export function useScoreEvents() {
  const [
    scoreEvents,
    setScoreEvents,
  ] = useState<ScoreEvent[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  async function loadScoreEvents() {
    const {
      data,
      error,
    } = await supabase
      .from("score_events")
      .select("*")
      .order(
        "awarded_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "LOAD SCORE EVENTS ERROR:",
        error
      );

      setLoading(false);
      return;
    }

    setScoreEvents(
      (data ?? []) as ScoreEvent[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadScoreEvents();

    const channel =
      supabase
        .channel(
          "score-events-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "score_events",
          },
          () => {
            loadScoreEvents();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  return {
    scoreEvents,
    loading,
  };
}