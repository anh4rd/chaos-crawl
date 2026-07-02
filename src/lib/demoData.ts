import type { Team } from "../types/team";
import type { Challenge } from "../types/challenge";

export const teams: Team[] = [
  {
    id: "pineapple",
    name: "Pineapples",
    emoji: "🍍",
    colour: "#FACC15",
  },
  {
    id: "duck",
    name: "Ducks",
    emoji: "🦆",
    colour: "#60A5FA",
  },
  {
    id: "beer",
    name: "Beer Mats",
    emoji: "🍺",
    colour: "#FB923C",
  },
];

export const challenges: Challenge[] = [
  {
    id: "pineapple",
    title: "Hide the pineapple",
    description: "Conceal a pineapple on your person.",
    points: 5,
    photoRequired: true,
  },
  {
    id: "nan",
    title: "Become Nan",
    description: "Take the most convincing Nan photo.",
    points: 10,
    photoRequired: true,
  },
];
