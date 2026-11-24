import type { GuidedTourStep } from "../../components/tour/GuidedTour";
import type { SessionStatus } from "./types";

export function hostTourSteps(status: SessionStatus): GuidedTourStep[] {
  if (status === "lobby")
    return [
      {
        target: '[data-tour="host-overview"]',
        title: "Your game overview",
        body: "The game name and code identify your session. The lobby steps help you prepare before starting.",
        page: "invite",
      },
      {
        target: '[data-tour="host-lobby-invite"]',
        title: "Invite your players",
        body: "Share the link, code or QR so players can join this game.",
        page: "invite",
      },
      {
        target: '[data-tour="host-lobby-participation"]',
        title: "Choose how to host",
        body: "Join the player list to play alongside everyone, or keep hosting without a player entry. A profile picture is optional.",
        page: "participation",
      },
      {
        target: '[data-tour="host-lobby-roster"]',
        title: "Check the roster",
        body: "See who has joined. When teams are enabled, set the number of players each team can hold.",
        page: "roster",
      },
      {
        target: '[data-tour="host-lobby-teams"]',
        title: "Choose your teams",
        body: "Select a player and move them between teams. Games for individual players can continue past this step.",
        page: "teams",
      },
      {
        target: '[data-tour="host-lobby-team-names"]',
        title: "Name your teams",
        body: "When teams are enabled, edit their names and pictures here. You can also move players between teams.",
        page: "team-names",
      },
      {
        target: '[data-tour="host-lobby-ready"]',
        title: "Ready when you are",
        body: "Check who is ready, explain the rules and start the game when everyone is prepared. This tour does not start the game.",
        page: "ready",
      },
    ];
  return [
    {
      target: '[data-tour="host-sections"]',
      title: "The same game sections",
      body: "Move between Game, Challenges and Scores. Host keeps management tools separate from the shared player screens.",
      page: "game",
    },
    {
      target: '[data-tour="host-player-game"]',
      title: "The player experience",
      body: "This is the same game screen players use. If host participation is enabled, join the roster here and complete challenges, upload evidence and follow the game like everyone else.",
      page: "game",
    },
    {
      target: '[data-tour="host-leaderboard"]',
      title: "Leaderboard",
      body: "Check player and team rankings here. Team scores combine the points earned by their members.",
      page: "leaderboard",
    },
    {
      target: '[data-tour="host-side-review"]',
      title: "Side challenges",
      body: "Review side-challenge submissions here. Submissions receive 5 points automatically, and tied top submissions receive the configured challenge bonus.",
      page: "host-review",
    },
    {
      target: '[data-tour="host-controls-tab"]',
      title: "Host-only controls",
      body: "This tab contains tools players cannot access: start or finish the game, navigate rounds, manage teams, review submissions and schedule secret missions.",
      page: "host-overrides",
    },
    {
      target: '[data-tour="host-start-controls"]',
      title: "Start and manage the game",
      body: "Share the join code and QR, choose a round, adjust the timer, open reviews and finish the game. Manage teams in the roster tab.",
      page: "host-overrides",
    },
    {
      target: '[data-tour="host-review"]',
      title: "Review main challenges",
      body: "Open submitted photos or videos, approve or reject the work and assign main-challenge points here. Side-challenge points are handled separately after voting.",
      page: "host-review",
    },
    {
      target: '[data-tour="host-reward"]',
      title: "Run a reward round",
      body: "Choose an enabled method, set the points, run voting or select winners, then show the results and return everyone to the game.",
      page: "reward-round",
    },
    {
      target: '[data-tour="host-final-round"]',
      title: "Run the final round",
      body: "Open side-challenge voting, cast the slideshow to a TV and vote alongside players from the submission list.",
      page: "host-overrides",
    },
  ];
}
