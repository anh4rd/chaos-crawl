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
    <Card className="live-task">
      <p className="live-task__kicker">Your Task</p>
      <h2 className="live-task__title">
        {challenge?.title ?? game.current_challenge}
      </h2>
      {description && <p className="live-task__copy">{description}</p>}
      {challenge && (
        <p className="live-task__points">+{challenge.points} points</p>
      )}
      {!challenge ? (
        <p className="live-task__waiting">
          Waiting for the host to reveal the next challenge...
        </p>
      ) : participation.hasCompleted("main", challenge.id) ? (
        <p className="live-task__completed">✓ Challenge completed</p>
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
