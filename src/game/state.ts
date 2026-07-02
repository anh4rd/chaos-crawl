import type { GameState } from "./types";

export const initialGame: GameState = {
  gameName: "Anna's Chaos Crawl",
  currentLocation: 0,
  currentChallenge: undefined,
  teams: [
    {
      id: "pineapple",
      name: "Pineapples",
      emoji: "🍍",
      colour: "#facc15",
      score: 0,
    },
    {
      id: "duck",
      name: "Ducks",
      emoji: "🦆",
      colour: "#60a5fa",
      score: 0,
    },
    {
      id: "beer",
      name: "Beer Mats",
      emoji: "🍺",
      colour: "#fb923c",
      score: 0,
    },
  ],
  players: [],
};
