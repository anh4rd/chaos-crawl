import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import type { ChallengeCompletion, Media, Player } from "../../types/database";

export interface SubmissionCardViewProps {
  completion: ChallengeCompletion;
  player: Player | undefined;
  media: Media | undefined;
  award: {
    points: string;
    setPoints: (value: string) => void;
    recipient: "player" | "team";
    setRecipient: (value: "player" | "team") => void;
    awarding: boolean;
    error: string | null;
    notice: string | null;
    award: () => Promise<void>;
  };
}

export default function SubmissionCardView({
  completion,
  player,
  media,
  award,
}: SubmissionCardViewProps) {
  const inputId = `points-${completion.id}`;
  return (
    <Card className="submission-card">
      <h2 className="submission-card__title">
        {player?.name ?? "Unknown player"}
      </h2>
      {player?.team && <p className="submission-card__team">{player.team}</p>}
      {media ? (
        <div className="submission-card__media">
          {media.media_type === "video" ? (
            <video
              src={media.image_url}
              controls
              playsInline
              className="submission-card__evidence"
            />
          ) : (
            <img
              src={media.image_url}
              alt="Challenge submission"
              className="submission-card__evidence"
            />
          )}
        </div>
      ) : (
        <p className="submission-card__empty">
          {completion.photo_id === null
            ? "Completed without media."
            : "Submission media is unavailable."}
        </p>
      )}
      <div className="submission-card__field">
        <label htmlFor={inputId} className="submission-card__label">
          Points to award {player ? `to ${player.name}` : ""}
        </label>
        <input
          id={inputId}
          type="number"
          value={award.points}
          disabled={award.awarding}
          onChange={(event) => award.setPoints(event.target.value)}
          placeholder="e.g. 10"
          className="submission-card__input"
        />
      </div>
      <label className="submission-card__recipient">
        Award to
        <select
          value={award.recipient}
          disabled={award.awarding}
          onChange={(event) =>
            award.setRecipient(
              event.target.value === "team" ? "team" : "player",
            )
          }
          className="submission-card__select"
        >
          <option value="player">Player</option>
          {player?.team && <option value="team">Team {player.team}</option>}
        </select>
      </label>
      {award.error && (
        <p role="alert" className="submission-card__feedback">
          {award.error}
        </p>
      )}
      {award.notice && (
        <p role="status" className="submission-card__feedback">
          {award.notice}
        </p>
      )}
      <div className="submission-card__field">
        <Button
          type="button"
          disabled={award.awarding || !player}
          onClick={() => void award.award()}
        >
          {award.awarding ? "Awarding..." : "Award Points"}
        </Button>
      </div>
    </Card>
  );
}
