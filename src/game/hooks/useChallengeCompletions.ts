import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

export interface ChallengeCompletion {
  id: string | number;
  player_id: string;
  challenge_type: string;
  challenge_id: string | number;
  points: number;
  photo_id: string | null;
  completed_at: string;
}

export default function useChallengeCompletions() {
  const [
    completions,
    setCompletions,
  ] = useState<
    ChallengeCompletion[]
  >([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data,
        error,
      } = await supabase
        .from(
          "challenge_completions"
        )
        .select("*")
        .order(
          "completed_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "LOAD COMPLETIONS ERROR:",
          error
        );
        return;
      }

      if (active) {
        setCompletions(
          data ?? []
        );
      }
    }

    load();

    const channel = supabase
      .channel(
        "challenge-completions"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "challenge_completions",
        },
        (payload) => {
          const eventType =
            payload.eventType ??
            (payload as {
              event?: string;
            }).event;

          setCompletions((current) => {
            const next = [...current];

            switch (eventType) {
              case "INSERT": {
                const completion =
                  payload.new as
                    | ChallengeCompletion
                    | undefined;

                if (
                  completion &&
                  !next.some(
                    (item) =>
                      item.id ===
                      completion.id
                  )
                ) {
                  next.unshift(
                    completion
                  );
                }

                return next.sort(
                  (a, b) =>
                    Date.parse(
                      b.completed_at
                    ) -
                    Date.parse(
                      a.completed_at
                    )
                );
              }
              case "UPDATE": {
                const completion =
                  payload.new as
                    | ChallengeCompletion
                    | undefined;

                if (!completion) {
                  return current;
                }

                const index = next.findIndex(
                  (item) =>
                    item.id ===
                    completion.id
                );

                if (index >= 0) {
                  next[index] =
                    completion;
                } else {
                  next.unshift(
                    completion
                  );
                }

                return next.sort(
                  (a, b) =>
                    Date.parse(
                      b.completed_at
                    ) -
                    Date.parse(
                      a.completed_at
                    )
                );
              }
              case "DELETE": {
                const completion =
                  payload.old as
                    | ChallengeCompletion
                    | undefined;

                if (!completion) {
                  return current;
                }

                return next.filter(
                  (item) =>
                    item.id !==
                    completion.id
                );
              }
              default:
                return current;
            }
          });
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

  return completions;
}