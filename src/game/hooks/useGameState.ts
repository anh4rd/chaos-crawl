import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

import {
  getGameState,
} from "../../lib/gameApi";


export interface GameState {
  id: number;

  current_pub: string;
  current_challenge: string;
  challenge_description: string;

  current_challenge_id:
    | number
    | null;

  current_challenge_order:
    number;

  voting_open: boolean;

  voting_target:
    | "player"
    | "team";

  show_vote_results: boolean;

  slideshow_open: boolean;

  scheduled_challenge_id:
    | number
    | null;

  scheduled_reveal_at:
    | string
    | null;
}


export function useGameState() {
  const [
    game,
    setGame,
  ] = useState<GameState | null>(
    null
  );

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data,
        error,
      } = await getGameState();

      if (error) {
        console.error(
          "LOAD GAME STATE ERROR:",
          error
        );

        return;
      }

      if (active) {
        setGame(
          data as GameState | null
        );
      }
    }

    void load();

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
          void load();
        }
      )
      .subscribe();

    return () => {
      active = false;

      void supabase.removeChannel(
        channel
      );
    };
  }, []);

  return game;
}
