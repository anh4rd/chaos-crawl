import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

export interface ChallengeCompletion {
  id: string | number;
  player_id: string;
  challenge_type: string;
  challenge_id: string | number;
  points: number;
  photo_id: string | null;
  completed_at: string;
}

export default function useChallengeCompletions() {
  const [
    completions,
    setCompletions,
  ] = useState<
    ChallengeCompletion[]
  >([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data,
        error,
      } = await supabase
        .from(
          "challenge_completions"
        )
        .select("*")
        .order(
          "completed_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "LOAD COMPLETIONS ERROR:",
          error
        );
        return;
      }

      if (active) {
        setCompletions(
          data ?? []
        );
      }
    }

    load();

    const channel = supabase
      .channel(
        "challenge-completions"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "challenge_completions",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  return completions;
}