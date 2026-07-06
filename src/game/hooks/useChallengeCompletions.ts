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

  // This spelling matches your
  // Supabase column exactly
  chellenge_type: string;

  challenge_id:
    | string
    | number;

  points: number;

  photo_id:
    | string
    | number
    | null;

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


    async function loadCompletions() {
      const {
        data,
        error,
      } = await supabase
        .from(
          "challenge_completions"
        )
        .select(`
          id,
          player_id,
          chellenge_type,
          challenge_id,
          points,
          photo_id,
          completed_at
        `)
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
          (data ?? []) as
            ChallengeCompletion[]
        );
      }
    }


    // Initial load
    loadCompletions();


    // Live updates
    const channel = supabase
      .channel(
        "challenge-completions-live"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "challenge_completions",
        },
        () => {
          loadCompletions();
        }
      )
      .subscribe(
        (status) => {
          console.log(
            "COMPLETIONS REALTIME:",
            status
          );
        }
      );


    return () => {
      active = false;

      supabase.removeChannel(
        channel
      );
    };
  }, []);


  return completions;
}