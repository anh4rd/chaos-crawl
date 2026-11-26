import SubmissionList from "../../components/session/SubmissionList";
import SubmissionRow from "../../components/session/SubmissionRow";
import EvidenceReview from "../../components/session/EvidenceReview";
import HostReviewSection from "./HostReviewSection";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import StatusPill from "../../components/ui/StatusPill";
import Note from "../../components/ui/Note";
import type {
  SessionChallenge,
  SessionEvidence,
  SessionPlayer,
  SessionSubmission,
  SessionTeam,
} from "./types";

interface Props {
  sideSubmissions: SessionSubmission[];
  playerById: Map<string, SessionPlayer>;
  teamById: Map<string, SessionTeam>;
  challengeById: Map<string, SessionChallenge>;
  evidenceForChallenge: (
    playerId: string,
    challengeId: string,
  ) => SessionEvidence[];
  evidenceUrl: (path: string) => string;
  votingEnabled: boolean;
  hostAwardsEnabled: boolean;
  busy: boolean;
  hostAwardedPoints: (challengeId: string) => number;
  onReviewChallenge: (challengeId: string) => void;
  onAwardPoints: (challenge: SessionChallenge) => void;
}
export default function HostSideSubmissions({
  sideSubmissions,
  playerById,
  teamById,
  challengeById,
  evidenceForChallenge,
  evidenceUrl,
  votingEnabled,
  hostAwardsEnabled,
  busy,
  hostAwardedPoints,
  onReviewChallenge,
  onAwardPoints,
}: Props) {
  return (
    <HostReviewSection
      title="Player submissions"
      icon="camera"
      open
      tourTarget="host-side-review"
      count={`${sideSubmissions.length} submissions`}
    >
      {sideSubmissions.length === 0 ? (
        <Note variant="session">
          Side-challenge submissions will appear here automatically after
          players submit evidence.
        </Note>
      ) : (
        <SubmissionList>
          {sideSubmissions.map((submission) => {
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
                challenge={challenge?.title ?? "Side challenge"}
                time={new Date(submission.submitted_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                status={submission.status}
                statusLabel={
                  submission.status === "rejected" ? "Rejected" : undefined
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
                    description: `Evidence for ${challenge?.title ?? "side challenge"}`,
                    labels: [
                      media.media_type === "video"
                        ? "Video evidence · included in final vote"
                        : "Photo evidence · included in final vote",
                    ],
                  }))}
                />
                {votingEnabled && (
                  <Note variant="session">
                    This challenge will be reviewed in the final by player vote.
                  </Note>
                )}
                {challenge && (
                  <ControlRow variant="review">
                    {hostAwardsEnabled && (
                      <StatusPill
                        variant="review"
                        tone={
                          hostAwardedPoints(challenge.id) > 0
                            ? "approved"
                            : "submitted"
                        }
                      >
                        {hostAwardedPoints(challenge.id) > 0
                          ? `Points awarded · ${hostAwardedPoints(challenge.id)} pts`
                          : "Points not awarded"}
                      </StatusPill>
                    )}
                    {votingEnabled && (
                      <Button
                        type="button"
                        variant="session-ghost"
                        fullWidth={false}
                        disabled={busy}
                        onClick={() => onReviewChallenge(challenge.id)}
                      >
                        Review this challenge
                      </Button>
                    )}
                    {hostAwardsEnabled &&
                      hostAwardedPoints(challenge.id) === 0 && (
                        <Button
                          type="button"
                          variant="session-action"
                          fullWidth={false}
                          disabled={busy}
                          onClick={() => onAwardPoints(challenge)}
                        >
                          Review & approve points
                        </Button>
                      )}
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
