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

    const channel = supabase
      .channel("players")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        (payload) => {
            console.log("Realtime payload:", payload);
          loadPlayers();
        }
      )

      .subscribe((status) => {
        console.log("Realtime status", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
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

    setPlayers(data ?? []);
  }

  return players;
}