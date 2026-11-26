var e=`import type { ChangeEvent } from "react";
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
  variant,
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
  variant?: "side-challenge" | "secret-mission";
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}) {
  const complete = status === "submitted" || status === "approved";
  return (
    <div
      className={\`session-submission\${variant ? \` session-submission--\${variant}\` : ""}\`}
    >
      {evidence.length > 0 && <EvidenceGallery items={evidence} />}
      <div className="session-submission__body">
        <div className="session-submission__actions">
          {allowUpload && (
            <label className="session-submission__upload">
              {variant === "side-challenge" || variant === "secret-mission" ? (
                <>
                  {uploading ? "Uploading…" : "Upload Evidence"}
                  <Icon
                    name="check"
                    className="icon--size-16"
                    aria-hidden="true"
                  />
                </>
              ) : (
                <>
                  <Icon
                    name="upload"
                    className="icon--size-16"
                    aria-hidden="true"
                  />
                  {uploading ? "Uploading…" : "Upload evidence"}
                </>
              )}
              <input
                aria-label={\`Upload evidence for \${title}\`}
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
          {!complete &&
            allowSubmit &&
            (variant !== "side-challenge" || evidence.length > 0) && (
              <button
                type="button"
                className="session-submission__submit"
                disabled={
                  disabled ||
                  busy ||
                  (evidenceRequired && evidence.length === 0)
                }
                onClick={onSubmit}
              >
                {submitLabel}
              </button>
            )}
        </div>

        {variant !== "side-challenge" &&
          evidenceRequired &&
          evidence.length === 0 && (
            <p>
              {variant === "secret-mission"
                ? "Upload evidence to finish."
                : "Upload at least one photo or video before marking this challenge complete."}
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
    </div>
  );
}
`;export{e as default};