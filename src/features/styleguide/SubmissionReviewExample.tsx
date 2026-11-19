import SubmissionList from "../../components/session/SubmissionList";
import ControlRow from "../../components/ui/ControlRow";
import { useState } from "react";
import EvidenceReview from "../../components/session/EvidenceReview";
import SubmissionRow from "../../components/session/SubmissionRow";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import Note from "../../components/ui/Note";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "./SessionPreview";

export default function SubmissionReviewExample() {
  const [status, setStatus] = useState<"submitted" | "approved" | "rejected">(
    "submitted",
  );
  const [notice, setNotice] = useState("No sample review selected.");
  const statusLabel =
    status === "submitted"
      ? "Needs review"
      : status === "approved"
        ? "+20 pts"
        : "Rejected";
  return (
    <Example
      title="Shared submission and evidence review"
      source="src/components/session/SubmissionRow.tsx + EvidenceReview.tsx"
      code={
        '<SubmissionRow participant="Pat" challenge="Team portrait" time="12:00" status="submitted" statusLabel="Needs review">\n  <EvidenceReview items={items} heading="1 evidence file" />\n</SubmissionRow>'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ContentPanel
            variant="session"
            stacked
            compact
            className="cc-host-main-review-card"
            aria-label="Local submission review"
          >
            <SubmissionList>
              <SubmissionRow
                participant="Pat"
                challenge="Team portrait"
                time="12:00"
                status={status}
                statusLabel={statusLabel}
              >
                <EvidenceReview
                  heading="1 evidence file"
                  items={[
                    {
                      id: "local-photo",
                      url: `${import.meta.env.BASE_URL}chaos-logo.png`,
                      mediaType: "image",
                      description: "Sample portrait evidence",
                      labels: [
                        "Photo evidence",
                        "Local example; no session evidence is loaded.",
                      ],
                    },
                  ]}
                />
                <ControlRow variant="review">
                  <Button
                    type="button"
                    variant="session-action"
                    fullWidth={false}
                    disabled={status !== "submitted"}
                    onClick={() => {
                      setStatus("approved");
                      setNotice("Sample approved locally; no points written.");
                    }}
                  >
                    Approve sample evidence
                  </Button>
                  <Button
                    type="button"
                    variant="session-ghost"
                    fullWidth={false}
                    disabled={status !== "submitted"}
                    onClick={() => {
                      setStatus("rejected");
                      setNotice(
                        "Sample rejected locally; no submission changed.",
                      );
                    }}
                  >
                    Reject sample evidence
                  </Button>
                </ControlRow>
              </SubmissionRow>
            </SubmissionList>
          </ContentPanel>
        </HostManagement>
      </SessionPreview>
      <Button
        type="button"
        variant="text"
        fullWidth={false}
        onClick={() => {
          setStatus("submitted");
          setNotice("Sample review reset locally.");
        }}
      >
        Reset sample evidence review
      </Button>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
