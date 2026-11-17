import Card from "../../components/ui/Card";
import type { SideChallenge } from "../../types/database";
import ChallengeActions, {
  type ChallengeParticipation,
} from "./ChallengeActions";

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
            <div
              key={challenge.id}
              className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold">{challenge.title}</h3>
                  {challenge.description && (
                    <p className="mt-2 text-sm text-zinc-300">
                      {challenge.description}
                    </p>
                  )}
                </div>
                <strong>+{challenge.points}</strong>
              </div>
              <ChallengeActions
                challenge={{
                  id: challenge.id,
                  title: challenge.title,
                  points: challenge.points,
                  type: "side",
                }}
                allowMedia={true}
                participation={participation}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
