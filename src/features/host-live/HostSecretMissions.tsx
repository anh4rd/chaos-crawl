import { secretAssignmentStatus } from "./secretAssignmentStatus";
import MissionAssignmentForm from "./MissionAssignmentForm";
import MissionCreationForm from "./MissionCreationForm";
import AssignmentList from "../../components/session/AssignmentList";
import EmptyState from "../../components/ui/EmptyState";
import AssignmentRow from "../../components/session/AssignmentRow";
import EvidenceReview from "../../components/session/EvidenceReview";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
import { challengeIcon } from "../../lib/challengeVisuals";
import type {
  GameSession,
  SecretMissionAssignment,
  SessionChallenge,
  SessionEvidence,
  SessionPlayer,
} from "./types";

interface Props {
  secretAssignments: SecretMissionAssignment[];
  votingAssignmentId: string | null;
  session: GameSession;
  assignSecretMission: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedSecretPlayerId: string;
  setSelectedSecretPlayerId: Dispatch<SetStateAction<string>>;
  busy: boolean;
  players: SessionPlayer[];
  selectedSecretChallengeId: string;
  setSelectedSecretChallengeId: Dispatch<SetStateAction<string>>;
  secretChallenges: SessionChallenge[];
  secretScheduleAt: string;
  setSecretScheduleAt: Dispatch<SetStateAction<string>>;
  createSecretChallenge: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  newSecretTitle: string;
  setNewSecretTitle: Dispatch<SetStateAction<string>>;
  newSecretDescription: string;
  setNewSecretDescription: Dispatch<SetStateAction<string>>;
  newSecretPoints: number;
  setNewSecretPoints: Dispatch<SetStateAction<number>>;
  newSecretEvidenceRequired: boolean;
  setNewSecretEvidenceRequired: Dispatch<SetStateAction<boolean>>;
  playerById: Map<string, SessionPlayer>;
  challengeById: Map<string, SessionChallenge>;
  evidenceForAssignment: (assignmentId: string) => SessionEvidence[];
  evidenceUrl: (path: string) => string;
}
export default function HostSecretMissions({
  secretAssignments,
  votingAssignmentId,
  session,
  assignSecretMission,
  selectedSecretPlayerId,
  setSelectedSecretPlayerId,
  busy,
  players,
  selectedSecretChallengeId,
  setSelectedSecretChallengeId,
  secretChallenges,
  secretScheduleAt,
  setSecretScheduleAt,
  createSecretChallenge,
  newSecretTitle,
  setNewSecretTitle,
  newSecretDescription,
  setNewSecretDescription,
  newSecretPoints,
  setNewSecretPoints,
  newSecretEvidenceRequired,
  setNewSecretEvidenceRequired,
  playerById,
  challengeById,
  evidenceForAssignment,
  evidenceUrl,
}: Props) {
  return (
    <ContentPanel variant="session" stacked>
      <PanelHeading variant="session">
        <div>
          <Overline as="div" variant="session" withIcon>
            <Icon name="shield" className="icon--size-14" /> PRIVATE MISSIONS
          </Overline>
          <h2>Secret missions</h2>
          <p>
            Assign each mission to one player. Leave the delivery time blank to
            send now, or schedule it for later in the game.
          </p>
        </div>
        <CountBadge variant="session">
          {
            secretAssignments.filter((item) => item.status === "scheduled")
              .length
          }{" "}
          scheduled
        </CountBadge>
      </PanelHeading>

      {session.status !== "completed" && (
        <>
          <MissionAssignmentForm
            assignSecretMission={assignSecretMission}
            selectedSecretPlayerId={selectedSecretPlayerId}
            setSelectedSecretPlayerId={setSelectedSecretPlayerId}
            busy={busy}
            players={players}
            selectedSecretChallengeId={selectedSecretChallengeId}
            setSelectedSecretChallengeId={setSelectedSecretChallengeId}
            secretChallenges={secretChallenges}
            secretScheduleAt={secretScheduleAt}
            setSecretScheduleAt={setSecretScheduleAt}
          />

          <MissionCreationForm
            createSecretChallenge={createSecretChallenge}
            newSecretTitle={newSecretTitle}
            setNewSecretTitle={setNewSecretTitle}
            newSecretDescription={newSecretDescription}
            setNewSecretDescription={setNewSecretDescription}
            newSecretPoints={newSecretPoints}
            setNewSecretPoints={setNewSecretPoints}
            newSecretEvidenceRequired={newSecretEvidenceRequired}
            setNewSecretEvidenceRequired={setNewSecretEvidenceRequired}
            busy={busy}
          />
        </>
      )}

      {secretAssignments.length > 0 ? (
        <AssignmentList>
          {secretAssignments.map((assignment) => {
            const player = playerById.get(assignment.player_id);
            const challenge = challengeById.get(assignment.challenge_id);
            const statusLabel = secretAssignmentStatus(
              assignment,
              assignment.id === votingAssignmentId,
            );
            return (
              <AssignmentRow
                key={assignment.id}
                icon={challengeIcon(
                  challenge?.title ?? "Secret mission",
                  challenge?.description ?? "",
                )}
                title={challenge?.title ?? "Secret mission"}
                recipient={<>For {player?.name ?? "player"}</>}
                status={statusLabel}
              >
                <EvidenceReview
                  items={evidenceForAssignment(assignment.id).map((media) => ({
                    id: media.id,
                    url: evidenceUrl(media.storage_path),
                    mediaType: media.media_type,
                    description: `Evidence for ${challenge?.title ?? "secret mission"}`,
                    labels: [
                      media.media_type === "video"
                        ? "Video evidence"
                        : "Photo evidence",
                    ],
                  }))}
                />
              </AssignmentRow>
            );
          })}
        </AssignmentList>
      ) : (
        <EmptyState icon="shield" variant="session">
          {secretChallenges.length > 0
            ? "No secret missions assigned yet. Pick one player and a mission above."
            : "There are no secret missions in this plan yet. Add one here, or select secret missions in Explore before creating a new game."}
        </EmptyState>
      )}
    </ContentPanel>
  );
}
