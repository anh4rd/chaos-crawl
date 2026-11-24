import StatusPill from "../ui/StatusPill";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";
import type { ReactNode } from "react";

export default function SubmissionRow({
  participant,
  avatarUrl,
  team,
  challenge,
  description,
  time,
  thumbnailUrl,
  thumbnailType,
  status,
  statusLabel,
  points,
  children,
}: {
  participant: string;
  avatarUrl?: string | null;
  team?: string;
  challenge: string;
  description?: string;
  time: string;
  thumbnailUrl?: string;
  thumbnailType?: "image" | "video";
  status: "submitted" | "approved" | "rejected";
  statusLabel?: string;
  points?: number;
  children?: ReactNode;
}) {
  return (
    <details className="submission-row">
      <summary className="submission-row__summary">
        <span className="submission-row__thumb" aria-hidden="true">
          {thumbnailUrl && thumbnailType === "image" ? (
            <img src={thumbnailUrl} alt="" loading="lazy" />
          ) : (
            <Icon
              name={thumbnailType === "video" ? "film" : "camera"}
              className="icon--size-24"
            />
          )}
        </span>
        <span className="submission-row__info">
          <strong className="submission-row__challenge">{challenge}</strong>
          <span className="submission-row__player">
            <Avatar name={participant} imageSrc={avatarUrl} variant="compact" />
            {participant}
            {team ? ` · ${team}` : ""}
          </span>
          <small>{time}</small>
        </span>
        <span className="submission-row__result">
          {statusLabel && (
            <StatusPill variant="review" tone={status}>
              {statusLabel}
            </StatusPill>
          )}
          {points !== undefined && points > 0 && (
            <span className="submission-row__points">{points} pts</span>
          )}
        </span>
        <Icon
          name="chevron-right"
          className="submission-row__open icon--size-20"
          aria-hidden="true"
        />
      </summary>
      <div className="submission-row__detail">
        {description && (
          <p className="submission-row__description">{description}</p>
        )}
        {children}
      </div>
    </details>
  );
}
