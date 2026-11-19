import SubmissionList from "../../components/session/SubmissionList";
import SubmissionRow from "../../components/session/SubmissionRow";
import EvidenceReview from "../../components/session/EvidenceReview";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import Note from "../../components/ui/Note";
import type {
  SessionChallenge,
  SessionEvidence,
  SessionPlayer,
  SessionSubmission,
} from "./types";

interface Props {
  sideSubmissions: SessionSubmission[];
  playerById: Map<string, SessionPlayer>;
  challengeById: Map<string, SessionChallenge>;
  evidenceForChallenge: (
    playerId: string,
    challengeId: string,
  ) => SessionEvidence[];
  evidenceUrl: (path: string) => string;
}
export default function HostSideSubmissions({
  sideSubmissions,
  playerById,
  challengeById,
  evidenceForChallenge,
  evidenceUrl,
}: Props) {
  return (
    <ContentPanel
      variant="session"
      stacked
      compact
      className="cc-host-side-review-card"
      data-tour="host-side-review"
    >
      <PanelHeading variant="session">
        <div>
          <Overline as="div" variant="session">
            SIDE CHALLENGE SUBMISSIONS
          </Overline>
          <h2>Player submissions</h2>
          <p>
            Every submission is automatically approved for 5 points. Tied top
            submissions also receive the challenge bonus.
          </p>
        </div>
        <CountBadge variant="session">
          {sideSubmissions.length} submissions
        </CountBadge>
      </PanelHeading>
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
                challenge={challenge?.title ?? "Side challenge"}
                time={new Date(submission.submitted_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                status={submission.status}
                statusLabel={
                  submission.status === "approved"
                    ? `Auto-approved · +${submission.awarded_points} pts`
                    : submission.status === "submitted"
                      ? "Awaiting automatic approval"
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
                    description: `Evidence for ${challenge?.title ?? "side challenge"}`,
                    labels: [
                      media.media_type === "video"
                        ? "Video evidence · included in final vote"
                        : "Photo evidence · included in final vote",
                    ],
                  }))}
                />
              </SubmissionRow>
            );
          })}
        </SubmissionList>
      )}
    </ContentPanel>
  );
}
