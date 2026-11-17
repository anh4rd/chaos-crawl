import type { ChangeEvent } from "react";
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
}) {
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
      {sideChallenges.map((challenge) => {
        const submission = view.my_submissions.find(
          (item) => item.challenge_id === challenge.id,
        );
        return (
          <SessionChallengeCard
            key={challenge.id}
            id={challenge.id}
            title={challenge.title}
            description={challenge.description}
            points={challenge.points}
          >
            <SessionSubmission
              lockOnSubmit
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
      })}
    </section>
  );
}
