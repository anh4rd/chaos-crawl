import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getPlayerId } from "../../lib/playerSession";

export function useCurrentPlayer() {
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const id = getPlayerId();

    if (!id) return;

    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single();

    setPlayer(data);
  }

  return player;
}