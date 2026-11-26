var e=`import Card from "../../components/ui/Card";
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
    <Card className="bingo-list">
      <h2 className="bingo-list__title">Chaos Bingo</h2>
      <p className="bingo-list__copy">Complete these throughout the crawl.</p>
      {available.length === 0 ? (
        <p className="bingo-list__completed">
          ✓ You completed all Chaos Bingo challenges.
        </p>
      ) : (
        <div className="bingo-list__items">
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
`;export{e as default};