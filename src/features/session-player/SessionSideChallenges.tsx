import type { ChangeEvent, ReactNode } from "react";
import Disclosure from "../../components/ui/Disclosure";
import SessionChallengeCard from "../../components/session/SessionChallengeCard";
import SessionState from "../../components/session/SessionState";
import SessionSubmission from "../../components/session/SessionSubmission";
import type {
  ChallengeInfo,
  SecretMission,
  SessionEvidence,
  SessionInfo,
  SessionPlayerInfo,
  SessionView,
} from "./types";

export default function SessionSideChallenges({
  sideChallenges,
  session,
  view,
  evidenceForChallenge,
  busyKey,
  uploadEvidence,
  player,
  submitChallenge,
  mediaUrl,
  addChallengeAction,
}: {
  sideChallenges: ChallengeInfo[];
  session: SessionInfo;
  view: SessionView;
  evidenceForChallenge: (challengeId: string) => SessionEvidence[];
  busyKey: string | null;
  uploadEvidence: (
    event: ChangeEvent<HTMLInputElement>,
    parent:
      | { type: "challenge"; challenge: ChallengeInfo }
      | { type: "secret"; mission: SecretMission },
  ) => Promise<void>;
  player: SessionPlayerInfo;
  submitChallenge: (challenge: ChallengeInfo) => Promise<void>;
  mediaUrl: (path: string) => string;
  addChallengeAction?: ReactNode;
}) {
  const isComplete = (challenge: ChallengeInfo) => {
    const status = view.my_submissions.find(
      (item) => item.challenge_id === challenge.id,
    )?.status;
    return status === "submitted" || status === "approved";
  };
  const activeChallenges = sideChallenges.filter((c) => !isComplete(c));
  const completedChallenges = sideChallenges.filter(isComplete);
  const renderChallenge = (challenge: ChallengeInfo) => {
    const submission = view.my_submissions.find(
      (item) => item.challenge_id === challenge.id,
    );
    return (
      <SessionChallengeCard
        key={challenge.id}
        id={challenge.id}
        title={challenge.title}
        description={challenge.description}
        teamsEnabled={session.teams_enabled}
      >
        <SessionSubmission
          lockOnSubmit
          variant="side-challenge"
          title={challenge.title}
          evidence={evidenceForChallenge(challenge.id).map((item) => ({
            id: item.id,
            url: mediaUrl(item.storage_path),
            mediaType: item.media_type,
            description: `Evidence for ${challenge.title}`,
          }))}
          status={submission?.status}
          awardedPoints={submission?.awarded_points}
          busy={busyKey !== null}
          uploading={busyKey === `upload:${challenge.id}`}
          disabled={
            session.status !== "live" ||
            (session.teams_enabled && !player.team_id)
          }
          evidenceRequired
          onUpload={(event) =>
            void uploadEvidence(event, { type: "challenge", challenge })
          }
          onSubmit={() => void submitChallenge(challenge)}
        />
      </SessionChallengeCard>
    );
  };

  return (
    <section data-tour="player-side-challenges">
      <h2 className="session-page__heading">Side challenges</h2>
      {session.status === "lobby" && (
        <SessionState title="Waiting for the host…">
          Side challenges become active when the host starts the game.
        </SessionState>
      )}
      {sideChallenges.length === 0 && (
        <SessionState title="No side challenges added" />
      )}
      <div className="challenge-list">
        {activeChallenges.map(renderChallenge)}
        {addChallengeAction}
      </div>
      {completedChallenges.length > 0 && (
        <Disclosure
          variant="session"
          summary={`Completed (${completedChallenges.length})`}
        >
          <div className="challenge-list">
            {completedChallenges.map(renderChallenge)}
          </div>
        </Disclosure>
      )}
    </section>
  );
}
