import type { ChangeEvent } from "react";
import Icon from "../ui/Icon";
import EvidenceGallery from "./EvidenceGallery";
import type { EvidencePresentation } from "./types";

export default function SessionSubmission({
  title,
  evidence,
  status,
  awardedPoints = 0,
  busy = false,
  uploading = false,
  disabled = false,
  evidenceRequired = false,
  allowUpload = true,
  lockOnSubmit = false,
  submitLabel = "Mark challenge complete",
  statusMessage,
  allowSubmit = true,
  onUpload,
  onSubmit,
}: {
  title: string;
  evidence: EvidencePresentation[];
  status?: "submitted" | "approved" | "rejected" | null;
  awardedPoints?: number;
  busy?: boolean;
  uploading?: boolean;
  disabled?: boolean;
  evidenceRequired?: boolean;
  allowUpload?: boolean;
  lockOnSubmit?: boolean;
  submitLabel?: string;
  statusMessage?: string;
  allowSubmit?: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}) {
  const complete = status === "submitted" || status === "approved";
  return (
    <div className="session-submission">
      <div className="session-submission__actions">
        {allowUpload && (
          <label className="session-submission__upload">
            <Icon name="upload" className="icon--size-16" aria-hidden="true" />
            {uploading ? "Uploading…" : "Upload evidence"}
            <input
              aria-label={`Upload evidence for ${title}`}
              type="file"
              accept="image/*,video/*"
              disabled={
                disabled ||
                busy ||
                status === "approved" ||
                (lockOnSubmit && complete) ||
                evidence.length >= 6
              }
              onChange={onUpload}
            />
          </label>
        )}
        {!complete && allowSubmit && (
          <button
            type="button"
            className="session-submission__submit"
            disabled={
              disabled || busy || (evidenceRequired && evidence.length === 0)
            }
            onClick={onSubmit}
          >
            {submitLabel}
          </button>
        )}
      </div>
      {evidence.length > 0 && <EvidenceGallery items={evidence} />}
      {evidenceRequired && evidence.length === 0 && (
        <p>
          Upload at least one photo or video before marking this challenge
          complete.
        </p>
      )}
      {statusMessage && <output>{statusMessage}</output>}
      {!statusMessage && status === "approved" && (
        <output>Approved · +{awardedPoints} points</output>
      )}
      {!statusMessage && status === "submitted" && (
        <output>Submitted · waiting for host review</output>
      )}
      {!statusMessage && status === "rejected" && (
        <output>Not approved yet. You can add evidence and resubmit.</output>
      )}
    </div>
  );
}
