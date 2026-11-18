import Button from "../../../components/ui/Button";
import ChallengeActions, {
  type ChallengeParticipation,
} from "../../game/ChallengeActions";
import type { Player, SideChallenge } from "../../../types/database";

export default function HostChallengeCard({
  challenge,
  completedBy,
  participation,
  onReview,
}: {
  challenge: SideChallenge;
  completedBy: Player[];
  participation: ChallengeParticipation;
  onReview: () => void;
}) {
  const completed = participation.hasCompleted("side", challenge.id);
  return (
    <section
      aria-label={challenge.title}
      className={`rounded-2xl border-2 p-4 ${completed ? "border-green-500 bg-green-950/40" : "border-pink-500 bg-black/70"}`}
    >
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="font-bold">{challenge.title}</h3>
          {challenge.description && (
            <p className="mt-1 text-sm text-zinc-300">
              {challenge.description}
            </p>
          )}
        </div>
        <strong>+{challenge.points}</strong>
      </div>
      {completed ? (
        <p className="mt-4 font-bold text-green-400">✓ Completed</p>
      ) : (
        <>
          <ChallengeActions
            challenge={{
              id: challenge.id,
              title: challenge.title,
              points: challenge.points,
              type: "side",
            }}
            allowMedia
            participation={participation}
          />
          <div className="mt-2">
            <Button type="button" onClick={onReview}>
              Review & Award Points
            </Button>
          </div>
        </>
      )}
      <div className="mt-4">
        <p className="text-xs uppercase text-zinc-400">Completed by</p>
        {completedBy.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-500">Nobody yet</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {completedBy.map((player) => (
              <span
                key={player.id}
                className="rounded-full bg-green-900/60 px-3 py-1 text-sm"
              >
                ✓ {player.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
