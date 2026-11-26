var e=`import ControlRow from "../../components/ui/ControlRow";
import SubmissionList from "../../components/session/SubmissionList";
import SubmissionRow from "../../components/session/SubmissionRow";
import EvidenceReview from "../../components/session/EvidenceReview";
import Note from "../../components/ui/Note";
import Button from "../../components/ui/Button";
import HostReviewSection from "./HostReviewSection";
import Icon from "../../components/ui/Icon";
import type {
  SessionChallenge,
  SessionEvidence,
  SessionPlayer,
  SessionSubmission,
  SessionTeam,
} from "./types";

interface Props {
  submissions: SessionSubmission[];
  challengeById: Map<string, SessionChallenge>;
  playerById: Map<string, SessionPlayer>;
  teamById: Map<string, SessionTeam>;
  evidenceForChallenge: (
    playerId: string,
    challengeId: string,
  ) => SessionEvidence[];
  evidenceUrl: (path: string) => string;
  busy: boolean;
  reviewSubmission: (
    submission: SessionSubmission,
    approve: boolean,
  ) => Promise<void>;
}
export default function HostMainSubmissions({
  submissions,
  challengeById,
  playerById,
  teamById,
  evidenceForChallenge,
  evidenceUrl,
  busy,
  reviewSubmission,
}: Props) {
  const mainSubmissions = submissions.filter(
    (item) => challengeById.get(item.challenge_id)?.kind === "main",
  );
  const pendingCount = mainSubmissions.filter(
    (item) => item.status === "submitted",
  ).length;
  return (
    <HostReviewSection
      title="Player submissions"
      icon="camera"
      open
      tourTarget="host-review"
      count={\`\${mainSubmissions.length} · \${pendingCount} pending\`}
    >
      {submissions.filter(
        (item) => challengeById.get(item.challenge_id)?.kind === "main",
      ).length === 0 ? (
        <Note variant="session">
          Main challenge submissions will appear here as players submit them.
        </Note>
      ) : (
        <SubmissionList>
          {submissions
            .filter(
              (item) => challengeById.get(item.challenge_id)?.kind === "main",
            )
            .map((submission) => {
              const player = playerById.get(submission.player_id);
              const challenge = challengeById.get(submission.challenge_id);
              const submissionMedia = evidenceForChallenge(
                submission.player_id,
                submission.challenge_id,
              );
              return (
                <SubmissionRow
                  key={submission.id}
                  participant={player?.name ?? "Player"}
                  avatarUrl={player?.avatar_url}
                  team={teamById.get(player?.team_id ?? "")?.name}
                  description={challenge?.description}
                  points={submission.awarded_points}
                  thumbnailType={submissionMedia[0]?.media_type}
                  thumbnailUrl={
                    submissionMedia[0]
                      ? evidenceUrl(submissionMedia[0].storage_path)
                      : undefined
                  }
                  challenge={challenge?.title ?? "Main challenge"}
                  time={new Date(submission.submitted_at).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                  status={submission.status}
                  statusLabel={
                    submission.status === "submitted"
                      ? "Needs review"
                      : submission.status === "approved"
                        ? \`+\${submission.awarded_points} pts\`
                        : "Rejected"
                  }
                >
                  <EvidenceReview
                    heading={
                      <>
                        {submissionMedia.length} evidence file
                        {submissionMedia.length === 1 ? "" : "s"}
                      </>
                    }
                    items={submissionMedia.map((media) => ({
                      id: media.id,
                      url: evidenceUrl(media.storage_path),
                      mediaType: media.media_type,
                      description: \`Evidence for \${challenge?.title ?? "challenge"}\`,
                      labels: [
                        media.media_type === "video"
                          ? "Video evidence"
                          : "Photo evidence",
                        "Main-round media isn't included in the final vote.",
                      ],
                    }))}
                  />
                  {submission.status === "submitted" && (
                    <ControlRow variant="review">
                      <Button
                        type="button"
                        variant="session-action"
                        fullWidth={false}
                        disabled={busy}
                        onClick={() => void reviewSubmission(submission, true)}
                      >
                        <Icon name="check" className="icon--size-15" /> Approve
                        & award points
                      </Button>
                      <Button
                        type="button"
                        variant="session-ghost"
                        fullWidth={false}
                        disabled={busy}
                        onClick={() => void reviewSubmission(submission, false)}
                      >
                        <Icon name="x" className="icon--size-15" /> Reject
                      </Button>
                    </ControlRow>
                  )}
                </SubmissionRow>
              );
            })}
        </SubmissionList>
      )}
    </HostReviewSection>
  );
}
`;export{e as default};