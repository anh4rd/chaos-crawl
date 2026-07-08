import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

export interface Player {
  id: string;
  name: string;
  team: string | null;
  team_id?: string | number | null;
  score?: number | null;
  points?: number | null;
}

export function usePlayers() {
  const [players, setPlayers] =
    useState<Player[]>([]);

  const loadPlayers =
    useCallback(async () => {
      console.log(
        "LOAD PLAYERS: starting"
      );

      const {
        data,
        error,
        status,
        statusText,
      } = await supabase
        .from("players")
        .select("*");

      console.log(
        "LOAD PLAYERS RESULT:",
        {
          data,
          error,
          status,
          statusText,
          count:
            data?.length ?? 0,
        }
      );

      if (error) {
        console.error(
          "LOAD PLAYERS ERROR:",
          error
        );
        return;
      }

      const nextPlayers =
        (data ?? []) as Player[];

      console.log(
        "SETTING PLAYERS:",
        nextPlayers
      );

      setPlayers(nextPlayers);
    }, []);

  useEffect(() => {
    console.log(
      "USE PLAYERS MOUNTED"
    );

    void loadPlayers();

    const channel =
      supabase
        .channel(
          `players-realtime-${crypto.randomUUID()}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
          },
          (payload) => {
            console.log(
              "PLAYER REALTIME EVENT:",
              payload
            );

            void loadPlayers();
          }
        )
        .subscribe(
          (status) => {
            console.log(
              "PLAYERS REALTIME STATUS:",
              status
            );
          }
        );

    return () => {
      console.log(
        "USE PLAYERS CLEANUP"
      );

      void supabase.removeChannel(
        channel
      );
    };
  }, [loadPlayers]);

  return players;
}