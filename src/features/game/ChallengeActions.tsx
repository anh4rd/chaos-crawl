import Button from "../../components/ui/Button";
import type {
  useChallengeParticipation,
  UploadChallenge,
} from "../../game/hooks/useChallengeParticipation";

export type ChallengeParticipation = Pick<
  ReturnType<typeof useChallengeParticipation>,
  | "completionKey"
  | "uploadingKey"
  | "completingKey"
  | "hasCompleted"
  | "complete"
  | "chooseUpload"
>;

export default function ChallengeActions({
  challenge,
  allowMedia,
  participation,
}: {
  challenge: UploadChallenge;
  allowMedia: boolean;
  participation: ChallengeParticipation;
}) {
  const key = participation.completionKey(challenge.type, challenge.id);
  const busy =
    participation.uploadingKey !== null || participation.completingKey !== null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        type="button"
        disabled={busy}
        onClick={() =>
          participation.complete(challenge.type, challenge.id, challenge.points)
        }
      >
        {participation.completingKey === key ? "Saving..." : "✓ Mark Done"}
      </Button>
      {allowMedia && (
        <Button
          type="button"
          disabled={busy}
          onClick={() => participation.chooseUpload(challenge)}
        >
          {participation.uploadingKey === key
            ? "Uploading..."
            : "📸 Upload Photo / Video"}
        </Button>
      )}
    </div>
  );
}
