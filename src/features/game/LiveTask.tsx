import Card from "../../components/ui/Card";
import type { Challenge, GameState } from "../../types/database";
import ChallengeActions, {
  type ChallengeParticipation,
} from "./ChallengeActions";

export default function LiveTask({
  challenge,
  game,
  participation,
}: {
  challenge: Challenge | undefined;
  game: GameState;
  participation: ChallengeParticipation;
}) {
  const description = challenge?.description ?? game.challenge_description;
  return (
    <Card>
      <p className="text-sm font-bold uppercase text-pink-400">Your Task</p>
      <h2 className="mt-2 text-3xl font-bold">
        {challenge?.title ?? game.current_challenge}
      </h2>
      {description && <p className="mt-3">{description}</p>}
      {challenge && (
        <p className="mt-3 text-xl font-bold text-yellow-400">
          +{challenge.points} points
        </p>
      )}
      {!challenge ? (
        <p className="mt-4 text-sm text-zinc-400">
          Waiting for the host to reveal the next challenge...
        </p>
      ) : participation.hasCompleted("main", challenge.id) ? (
        <p className="mt-4 font-bold text-green-400">✓ Challenge completed</p>
      ) : (
        <ChallengeActions
          challenge={{
            id: challenge.id,
            title: challenge.title,
            points: challenge.points,
            type: "main",
          }}
          allowMedia={challenge.allow_photo_upload}
          participation={participation}
        />
      )}
    </Card>
  );
}
