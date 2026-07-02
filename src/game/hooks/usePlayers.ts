import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

export interface Player {
  id: string;
  name: string;
  team: string;
  score: number;
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("joined_at");

    if (error) {
      console.error(error);
      return;
    }

    setPlayers(data);
  }

  return players;
}