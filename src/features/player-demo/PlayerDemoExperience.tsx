import type { GuidedTourStep } from "../../components/tour/GuidedTour";
import PlayerDemoView from "./PlayerDemoView";
import { usePlayerDemo } from "./usePlayerDemo";
import "../../styles/PlayerGame.css";

const steps: GuidedTourStep[] = [
  {
    target: '[data-tour="demo-profile"]',
    title: "Your player card",
    body: "Your avatar, team and score are always easy to find here. In a real game, your points update as challenges are approved and rewards are awarded.",
    page: "game",
  },
  {
    target: '[data-tour="demo-navigation"]',
    title: "Find your way around",
    body: "Use the bottom tabs to move between the current game, leaderboard, side challenges and the final vote when it opens.",
    page: "game",
  },
  {
    target: '[data-tour="demo-challenge"]',
    title: "Read the challenge",
    body: "Every main challenge has a title, instructions, time allowance and evidence rules. Read it before you start.",
    page: "game",
  },
  {
    target: '[data-tour="demo-upload"]',
    title: "Upload your evidence",
    body: "Tap Upload evidence to add a photo or video when a task asks for proof. Then mark the task complete so the host can review it.",
    page: "game",
  },
  {
    target: '[data-tour="demo-leaderboard"]',
    title: "Check your position",
    body: "The leaderboard shows individual and team standings. Scores change when the host approves eligible work or completes a reward round.",
    page: "leaderboard",
  },
  {
    target: '[data-tour="demo-side"]',
    title: "Take on side challenges",
    body: "These optional tasks run alongside the main round. Open a task, follow its instructions, upload evidence if requested and submit it.",
    page: "side-challenges",
  },
  {
    target: '[data-tour="demo-final"]',
    title: "Vote in the final",
    body: "When the host opens the final gallery, browse the saved photos and videos and vote for your favourite. The winner receives the configured points after voting closes.",
    page: "final",
  },
];

export default function PlayerDemoExperience() {
  const demo = usePlayerDemo();
  return <PlayerDemoView {...demo} steps={steps} />;
}
