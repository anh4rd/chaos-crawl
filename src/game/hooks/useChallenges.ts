import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

export interface Challenge {
  id: number;
  pub_id: number | null;

  title: string;
  description: string | null;

  points: number;

  reveal_order: number;

  allow_photo_upload: boolean;
}

export function useChallenges() {
  const [
    challenges,
    setChallenges,
  ] = useState<Challenge[]>([]);

  useEffect(() => {
    async function loadChallenges() {
      const {
        data,
        error,
      } = await supabase
        .from("challenges")
        .select(`
          id,
          pub_id,
          title,
          description,
          points,
          reveal_order,
          allow_photo_upload
        `)
        .order(
          "reveal_order",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "LOAD CHALLENGES ERROR",
          error
        );

        return;
      }

      setChallenges(
        (data ?? []) as Challenge[]
      );
    }

    loadChallenges();

    const channel =
      supabase
        .channel(
          "challenges-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "challenges",
          },
          () => {
            loadChallenges();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  return challenges;
}