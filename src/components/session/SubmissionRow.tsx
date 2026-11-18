import StatusPill from "../ui/StatusPill";
import type { ReactNode } from "react";

export default function SubmissionRow({
  participant,
  challenge,
  time,
  status,
  statusLabel,
  children,
}: {
  participant: string;
  challenge: string;
  time: string;
  status: "submitted" | "approved" | "rejected";
  statusLabel: string;
  children?: ReactNode;
}) {
  return (
    <article className="submission-row">
      <div className="submission-row__info">
        <strong>{participant}</strong>
        <span>{challenge}</span>
        <small>{time}</small>
      </div>
      <StatusPill variant="review" tone={status}>
        {statusLabel}
      </StatusPill>
      {children}
    </article>
  );
}
