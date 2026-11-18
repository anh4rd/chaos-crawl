import type { SideChallenge } from "../../types/database";
import ChallengeActions, {
  type ChallengeParticipation,
} from "./ChallengeActions";

export default function BingoChallengeCard({
  challenge,
  participation,
}: {
  challenge: SideChallenge;
  participation: ChallengeParticipation;
}) {
  return (
    <div className="rounded-2xl border-2 border-pink-500 bg-black/70 p-4">
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
  );
}
