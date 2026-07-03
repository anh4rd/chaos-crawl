import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface SideChallenge {
  id: number;
  title: string;
  description: string;
  points: number;
  active: boolean;
}

export default function useSideChallenges(): SideChallenge[] {
  const [challenges, setChallenges] = useState<SideChallenge[]>([]);

  async function load() {
    const { data } = await supabase
      .from("side_challenges")
      .select("*")
      .eq("active", true)
      .order("id");

    setChallenges(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return challenges;
}
