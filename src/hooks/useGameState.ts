import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getGameState } from "../lib/gameApi";

export interface GameState {
  id: number;
  current_pub: string;
  current_challenge: string;
  challenge_description: string;
  broadcast_message: string;
  voting_open?: boolean;
  voting_target: "player" | "team";
}

export function useGameState() {
  const [game, setGame] = useState<GameState | null>(null);

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
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data, error } = await getGameState();

    console.log("GAME DATA", data);
    console.log("GAME ERROR", error);

    if (error) return;

    setGame(data);
  }

  return game;
}