import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import { getGameState } from "../../lib/gameApi";

export function useGameState() {
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("game-state")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data } = await getGameState();
    setGame(data);
  }

  return game;
}