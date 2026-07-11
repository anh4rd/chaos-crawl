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

            const eventType =
              payload.eventType ??
              (payload as {
                event?: string;
              }).event;

            setPlayers((current) => {
              const next = [...current];

              switch (eventType) {
                case "INSERT": {
                  const newPlayer =
                    payload.new as
                      | Player
                      | undefined;

                  if (
                    newPlayer &&
                    !next.some(
                      (player) =>
                        player.id ===
                        newPlayer.id
                    )
                  ) {
                    next.unshift(
                      newPlayer
                    );
                  }

                  return next;
                }
                case "UPDATE": {
                  const updatedPlayer =
                    payload.new as
                      | Player
                      | undefined;

                  if (!updatedPlayer) {
                    return current;
                  }

                  const index = next.findIndex(
                    (player) =>
                      player.id ===
                      updatedPlayer.id
                  );

                  if (index >= 0) {
                    next[index] =
                      updatedPlayer;
                  } else {
                    next.unshift(
                      updatedPlayer
                    );
                  }

                  return next;
                }
                case "DELETE": {
                  const deletedPlayer =
                    payload.old as
                      | Player
                      | undefined;

                  if (!deletedPlayer) {
                    return current;
                  }

                  return next.filter(
                    (player) =>
                      player.id !==
                      deletedPlayer.id
                  );
                }
                default:
                  return current;
              }
            });
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