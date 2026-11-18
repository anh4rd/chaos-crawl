import { challengeIcon } from "../../lib/challengeVisuals";
import type { SessionStatus } from "./types";

export function upcomingStageModel({
  status,
  nextRound,
  currentRound,
  onBreak,
  breakMinutes,
  resumeRound,
}: {
  status: SessionStatus;
  nextRound: { title: string; description: string } | undefined;
  currentRound: number;
  onBreak: boolean;
  breakMinutes: number;
  resumeRound: number | null;
}) {
  if (status !== "live" || !nextRound) return null;
  if (onBreak)
    return {
      highlighted: true,
      illustration: "☕",
      label: "BREAK IN PROGRESS",
      title: `Round ${resumeRound ?? currentRound + 1} follows the break`,
      description:
        "Players will be moved to the next challenge when the break ends.",
    };
  if (breakMinutes > 0)
    return {
      highlighted: true,
      illustration: "☕",
      label: `▶ NEXT UP · BREAK · ${breakMinutes} MIN`,
      title: `Break · ${breakMinutes} minutes`,
      description: `After the break: ${nextRound.title}`,
    };
  return {
    highlighted: false,
    illustration: challengeIcon(nextRound.title, nextRound.description),
    label: `▶ NEXT CHALLENGE · ROUND ${currentRound + 1}`,
    title: nextRound.title,
    description: nextRound.description,
  };
}
