import { useEffect, useState } from "react";
import { getGame } from "../lib/gameApi";

export function useGame() {
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    loadGame();
  }, []);

  async function loadGame() {
    const { data } = await getGame();
    setGame(data);
  }

  return game;
}