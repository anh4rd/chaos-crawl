import Card from "../../components/ui/Card";
import type { SideChallenge } from "../../types/database";
import type { ChallengeParticipation } from "./ChallengeActions";
import BingoChallengeCard from "./BingoChallengeCard";

export default function SideChallenges({
  challenges,
  participation,
}: {
  challenges: SideChallenge[];
  participation: ChallengeParticipation;
}) {
  const available = challenges.filter(
    (challenge) => !participation.hasCompleted("side", challenge.id),
  );
  return (
    <Card>
      <h2 className="text-2xl font-bold">Chaos Bingo</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Complete these throughout the crawl.
      </p>
      {available.length === 0 ? (
        <p className="mt-4 text-green-400">
          ✓ You completed all Chaos Bingo challenges.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4">
          {available.map((challenge) => (
            <BingoChallengeCard
              key={challenge.id}
              challenge={challenge}
              participation={participation}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
