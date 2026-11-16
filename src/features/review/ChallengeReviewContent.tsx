import { useMemo } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { usePlayers } from "../../game/hooks/usePlayers";
import type { ChallengeType } from "../../types/database";
import { useChallengeReview } from "./useChallengeReview";
import SubmissionCard from "./SubmissionCard";

export default function ChallengeReviewContent({
  challengeType,
  challengeId,
  challengeTitle,
}: {
  challengeType: ChallengeType;
  challengeId: string;
  challengeTitle: string;
}) {
  const players = usePlayers();
  const review = useChallengeReview(challengeType, challengeId);
  const playerById = useMemo(
    () => new Map(players.data.map((player) => [player.id, player])),
    [players.data],
  );
  const mediaById = useMemo(
    () => new Map(review.media.map((media) => [String(media.id), media])),
    [review.media],
  );

  if (review.loading || players.loading)
    return (
      <Card>
        <p role="status">Loading completions...</p>
      </Card>
    );
  if (review.error || players.error)
    return (
      <Card>
        <p role="alert">
          Could not load challenge review:{" "}
          {review.error ?? players.error?.message}
        </p>
        <Button
          type="button"
          onClick={() => {
            review.reload();
            void players.reload();
          }}
        >
          Retry review
        </Button>
      </Card>
    );
  if (!review.completions.length)
    return (
      <Card>
        <p>Nobody has completed this challenge yet.</p>
      </Card>
    );
  return (
    <div className="space-y-4">
      {review.completions.map((completion) => (
        <SubmissionCard
          key={completion.id}
          completion={completion}
          player={playerById.get(completion.player_id)}
          media={mediaById.get(String(completion.photo_id))}
          challengeType={challengeType}
          challengeId={challengeId}
          challengeTitle={challengeTitle}
        />
      ))}
    </div>
  );
}
