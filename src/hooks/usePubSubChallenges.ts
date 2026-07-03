import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface PubSubChallenge {
  id: number;
  pub_id: number;
  title: string;
  description: string | null;
  points: number;
  active: boolean;
}

export default function usePubSubChallenges() {
  const [subChallenges, setSubChallenges] =
    useState<PubSubChallenge[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("pub_sub_challenges")
        .select("*")
        .eq("active", true)
        .order("id");

      if (error) {
        console.error(
          "LOAD PUB SUB CHALLENGES ERROR",
          error
        );
        return;
      }

      setSubChallenges(data ?? []);
    }

    load();
  }, []);

  return subChallenges;
}