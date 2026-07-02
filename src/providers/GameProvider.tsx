import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import { initialGame } from "../game/state";
import type { GameState } from "../game/types";

interface GameContextType {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(initialGame);

  return (
    <GameContext.Provider value={{ game, setGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("Missing GameProvider");
  }

  return context;
}
