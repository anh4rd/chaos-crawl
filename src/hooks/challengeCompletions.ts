import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

import type { ChallengeCompletion } from "../lib/completionApi";

export default function useChallengeCompletions() {
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("challenge_completions")
        .select("*")
        .order("completed_at", {
          ascending: false,
        });

      if (error) {
        console.error("LOAD COMPLETIONS ERROR", error);
        return;
      }

      setCompletions(data ?? []);
    }

    load();

    const channel = supabase
      .channel("challenge-completions-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_completions",
        },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return completions;
}
