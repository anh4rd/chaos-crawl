var e=`import { secretAssignmentStatus } from "./secretAssignmentStatus";
import Button from "../../components/ui/Button";
import AssignmentList from "../../components/session/AssignmentList";
import EmptyState from "../../components/ui/EmptyState";
import AssignmentRow from "../../components/session/AssignmentRow";
import EvidenceReview from "../../components/session/EvidenceReview";
import ContentPanel from "../../components/ui/ContentPanel";
import FormLabel from "../../components/ui/FormLabel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import { useState, type ReactNode } from "react";
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
  forms: ReactNode;
  busy: boolean;
  secretChallenges: SessionChallenge[];
  playerById: Map<string, SessionPlayer>;
  challengeById: Map<string, SessionChallenge>;
  evidenceForAssignment: (assignmentId: string) => SessionEvidence[];
  evidenceUrl: (path: string) => string;
  rescheduleSecretMission: (
    assignmentId: string,
    localSchedule: string,
  ) => Promise<boolean>;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function HostSecretMissions({
  secretAssignments,
  votingAssignmentId,
  session,
  forms,
  busy,
  secretChallenges,
  playerById,
  challengeById,
  evidenceForAssignment,
  evidenceUrl,
  rescheduleSecretMission,
}: Props) {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const [scheduleDraft, setScheduleDraft] = useState("");

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

      {session.status !== "completed" && forms}

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
                <>
                  <EvidenceReview
                    items={evidenceForAssignment(assignment.id).map(
                      (media) => ({
                        id: media.id,
                        url: evidenceUrl(media.storage_path),
                        mediaType: media.media_type,
                        description: \`Evidence for \${challenge?.title ?? "secret mission"}\`,
                        labels: [
                          media.media_type === "video"
                            ? "Video evidence"
                            : "Photo evidence",
                        ],
                      }),
                    )}
                  />
                  {assignment.status === "scheduled" &&
                    session.status !== "completed" &&
                    assignment.id !== votingAssignmentId &&
                    (editingScheduleId === assignment.id ? (
                      <form
                        className="mission-reschedule"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void rescheduleSecretMission(
                            assignment.id,
                            scheduleDraft,
                          ).then((updated) => {
                            if (updated) setEditingScheduleId(null);
                          });
                        }}
                      >
                        <FormLabel
                          variant="session"
                          className="mission-reschedule__time"
                        >
                          Delivery time
                          <input
                            type="datetime-local"
                            required
                            value={scheduleDraft}
                            onChange={(event) =>
                              setScheduleDraft(event.target.value)
                            }
                            disabled={busy}
                          />
                        </FormLabel>
                        <Button
                          type="submit"
                          variant="session-action"
                          fullWidth={false}
                          disabled={busy || !scheduleDraft}
                        >
                          Save time
                        </Button>
                        <Button
                          type="button"
                          variant="session-secondary"
                          fullWidth={false}
                          disabled={busy}
                          onClick={() => setEditingScheduleId(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <Button
                        type="button"
                        variant="session-secondary"
                        fullWidth={false}
                        disabled={busy}
                        aria-label={\`Edit schedule for \${challenge?.title ?? "Secret mission"}\`}
                        onClick={() => {
                          setScheduleDraft(
                            toDateTimeLocal(assignment.scheduled_at),
                          );
                          setEditingScheduleId(assignment.id);
                        }}
                      >
                        <Icon name="calendar-clock" className="icon--size-14" />{" "}
                        Edit schedule
                      </Button>
                    ))}
                </>
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
`;export{e as default};