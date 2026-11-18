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
    <Card>
      <h2 className="text-2xl font-bold">{player?.name ?? "Unknown player"}</h2>
      {player?.team && <p className="mt-1">{player.team}</p>}
      {media ? (
        <div className="mt-4 overflow-hidden rounded-2xl">
          {media.media_type === "video" ? (
            <video
              src={media.image_url}
              controls
              playsInline
              className="w-full"
            />
          ) : (
            <img
              src={media.image_url}
              alt="Challenge submission"
              className="w-full"
            />
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm">
          {completion.photo_id === null
            ? "Completed without media."
            : "Submission media is unavailable."}
        </p>
      )}
      <div className="mt-4">
        <label htmlFor={inputId} className="text-sm font-bold">
          Points to award {player ? `to ${player.name}` : ""}
        </label>
        <input
          id={inputId}
          type="number"
          value={award.points}
          disabled={award.awarding}
          onChange={(event) => award.setPoints(event.target.value)}
          placeholder="e.g. 10"
          className="mt-2 w-full rounded-xl border-2 border-pink-500 bg-black p-3 text-white"
        />
      </div>
      <label className="mt-3 block">
        Award to
        <select
          value={award.recipient}
          disabled={award.awarding}
          onChange={(event) =>
            award.setRecipient(
              event.target.value === "team" ? "team" : "player",
            )
          }
          className="ml-2 rounded bg-black p-2 text-white"
        >
          <option value="player">Player</option>
          {player?.team && <option value="team">Team {player.team}</option>}
        </select>
      </label>
      {award.error && (
        <p role="alert" className="mt-3">
          {award.error}
        </p>
      )}
      {award.notice && (
        <p role="status" className="mt-3">
          {award.notice}
        </p>
      )}
      <div className="mt-4">
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
