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
  id?: string | number;

  current_pub: string;
  current_challenge: string;
  challenge_description: string;

  voting_open: boolean;

  voting_target:
    | "player"
    | "team";

  show_vote_results: boolean;

  slideshow_open: boolean;

  broadcast_message?:
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

      console.log(
        "GAME DATA",
        data
      );

      console.log(
        "GAME ERROR",
        error
      );

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
      active = false;

      supabase.removeChannel(
        channel
      );
    };
  }, []);

  return game;
}