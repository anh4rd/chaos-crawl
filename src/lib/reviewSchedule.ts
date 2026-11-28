export function reviewScheduleItem({
  sideChallenges,
  secretMissions,
  finalDuration,
  sideCount,
}: {
  sideChallenges: boolean;
  secretMissions: boolean;
  finalDuration: number | null;
  sideCount: number;
}) {
  if (!sideChallenges && !secretMissions) return null;
  const title =
    sideChallenges && secretMissions
      ? "Review side challenges and secret missions"
      : sideChallenges
        ? "Review side challenges"
        : "Review secret missions";
  return {
    id: "final-review",
    type: "final-review",
    title,
    duration:
      sideChallenges && finalDuration !== null
        ? finalDuration + sideCount * 5
        : 0,
  };
}
