import type { GameState } from "../../../types/database";
import type { useGameControls } from "./useGameControls";
export type GameControls = Omit<ReturnType<typeof useGameControls>, "game"> & {
  game: GameState;
};
