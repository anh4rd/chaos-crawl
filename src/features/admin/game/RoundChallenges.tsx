import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { GameControls } from "./gameControlTypes";

export default function RoundChallenges({
  controls,
}: {
  controls: Pick<
    GameControls,
    | "game"
    | "currentRoundChallenges"
    | "currentChallengeIndex"
    | "nextRoundChallenge"
    | "revealRoundChallenge"
  >;
}) {
  const {
    game,
    currentRoundChallenges,
    currentChallengeIndex,
    nextRoundChallenge,
    revealRoundChallenge,
  } = controls;
  return (
    <Card>
      <h2 className="text-2xl font-bold">Round Challenges</h2>

      <p className="mt-2 text-sm text-zinc-400">
        Reveal challenges throughout the round.
      </p>

      {currentRoundChallenges.length === 0 ? (
        <p className="mt-4">No challenges assigned to this pub.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {currentRoundChallenges.map((challenge, index) => {
            const isLive =
              String(game?.current_challenge_id) === String(challenge.id);

            const hasPassed =
              currentChallengeIndex >= 0 && index < currentChallengeIndex;

            const isNext = nextRoundChallenge?.id === challenge.id;

            return (
              <div
                key={challenge.id}
                className={`
                rounded-2xl border-2 p-4
                ${
                  isLive
                    ? "border-yellow-400 bg-pink-500"
                    : hasPassed
                      ? "border-zinc-700 bg-zinc-900 opacity-60"
                      : "border-pink-500 bg-black/70"
                }
              `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-zinc-400">
                      Challenge {index + 1}
                    </p>

                    <h3 className="mt-1 text-xl font-bold">
                      {challenge.title}
                    </h3>

                    {challenge.description && (
                      <p className="mt-2">{challenge.description}</p>
                    )}

                    <p className="mt-2 font-bold">
                      +{challenge.points ?? 0} points
                    </p>
                  </div>

                  {isLive && (
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                      LIVE
                    </span>
                  )}

                  {hasPassed && (
                    <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs font-bold">
                      DONE
                    </span>
                  )}

                  {isNext && !isLive && (
                    <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-bold">
                      NEXT
                    </span>
                  )}
                </div>

                {!isLive && !hasPassed && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={() => revealRoundChallenge(challenge)}
                    >
                      Reveal Now
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {nextRoundChallenge && (
        <div className="mt-6 border-t border-zinc-700 pt-4">
          <Button
            type="button"
            onClick={() => revealRoundChallenge(nextRoundChallenge)}
          >
            Reveal Next Challenge
          </Button>
        </div>
      )}
    </Card>
  );
}
