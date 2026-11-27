import { useState, type ChangeEvent } from "react";
import SessionChallengeCard from "../../components/session/SessionChallengeCard";
import SessionSubmission from "../../components/session/SessionSubmission";
import FormLabel from "../../components/ui/FormLabel";
import type { EvidencePresentation } from "../../components/session/types";
import type { SecretMission } from "./types";

export default function SecretMissionCard({
  mission,
  evidence,
  finalOutcome,
  busy,
  uploading,
  onUpload,
  onSubmit,
  onDismiss,
}: {
  mission: SecretMission;
  evidence: EvidencePresentation[];
  finalOutcome?: "success" | "fail";
  busy: boolean;
  uploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (answer?: string) => void;
  onDismiss: () => void;
}) {
  const [answer, setAnswer] = useState(mission.answer ?? "");
  const complete =
    mission.status === "submitted" ||
    mission.status === "approved" ||
    Boolean(finalOutcome);
  const statusMessage =
    mission.status === "sent"
      ? "Mission received — go do your thing"
      : mission.status === "submitted"
        ? "Marked complete · waiting for the group review"
        : mission.status === "approved"
          ? `Mission approved · +${mission.awarded_points} points`
          : finalOutcome === "fail"
            ? "Mission failed · final result · no points"
            : "The host asked you to try again";
  return (
    <SessionChallengeCard
      id={mission.assignment_id}
      kind="secret"
      title={mission.title}
      description={mission.description}
      points={mission.points}
    >
      {mission.response_mode === "text" && (
        <FormLabel variant="session">
          <span>Your answer</span>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={2000}
            rows={4}
            disabled={complete || Boolean(finalOutcome)}
            required
          />
        </FormLabel>
      )}
      <SessionSubmission
        variant="secret-mission"
        title={mission.title}
        status={mission.status === "sent" ? null : mission.status}
        evidence={evidence}
        awardedPoints={mission.awarded_points}
        busy={busy}
        uploading={uploading}
        disabled={
          Boolean(finalOutcome) ||
          (mission.response_mode === "text" && !answer.trim())
        }
        evidenceRequired={
          mission.response_mode !== "text" && mission.allow_photo_upload
        }
        allowUpload={mission.response_mode !== "text"}
        allowSubmit={!complete}
        submitLabel={
          mission.status === "rejected"
            ? "Try again — I've done it"
            : "I've completed my mission"
        }
        statusMessage={statusMessage}
        onUpload={onUpload}
        onSubmit={() =>
          onSubmit(mission.response_mode === "text" ? answer : undefined)
        }
      />
      {complete && (
        <button type="button" className="btn" onClick={onDismiss}>
          Dismiss completed mission
        </button>
      )}
    </SessionChallengeCard>
  );
}
