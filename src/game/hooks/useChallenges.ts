import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function useChallenges() {
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("challenges")
        .select("*");

      setChallenges(data ?? []);
    }

    load();
  }, []);

  return challenges;
}