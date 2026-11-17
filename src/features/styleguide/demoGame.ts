import type { GameState } from "../../types/database";

export const demoGame: GameState = {
  id: 1,
  current_pub: "The starting line",
  current_challenge: "Strike a pose",
  challenge_description: "Get your whole team into one legendary photo.",
  current_challenge_id: 1,
  current_challenge_order: 1,
  voting_open: false,
  voting_target: "player",
  show_vote_results: false,
  slideshow_open: false,
  scheduled_challenge_id: null,
  scheduled_reveal_at: null,
};
