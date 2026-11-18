import type { ReactNode } from "react";
import Icon from "../ui/Icon";
import type { RankedParticipant } from "./types";

export default function SessionRankRow({
  entry,
  variant,
  rank,
  selected = false,
  action,
}: {
  entry: RankedParticipant;
  variant?: "compact";
  rank: number;
  selected?: boolean;
  action?: ReactNode;
}) {
  if (variant === "compact")
    return (
      <span className="session-rank-row session-rank-row--compact">
        <b>
          {rank}. {entry.name}
        </b>
        <small>{entry.score} pts</small>
      </span>
    );
  return (
    <article
      className={`session-rank-row${selected ? " session-rank-row--selected" : ""}`}
    >
      <span className="session-rank-row__rank">
        {rank === 1 ? (
          <Icon name="crown" className="icon--size-17" aria-hidden="true" />
        ) : (
          rank
        )}
      </span>
      <span className="session-rank-row__avatar">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" />
        ) : (
          entry.name.slice(0, 1).toUpperCase()
        )}
      </span>
      <span className="session-rank-row__name">
        <strong>
          {entry.name}
          {selected ? " · YOU" : ""}
        </strong>
        <small>{entry.detail ?? entry.teamName ?? "Solo"}</small>
      </span>
      <strong className="session-rank-row__score">{entry.score} pts</strong>
      {action}
    </article>
  );
}
