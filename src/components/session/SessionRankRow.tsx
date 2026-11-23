import type { ReactNode } from "react";
import Icon from "../ui/Icon";
import type { RankedParticipant } from "./types";

export default function SessionRankRow({
  entry,
  variant,
  rank,
  selected = false,
  action,
  firstPlaceTrophy = false,
  hostRanking = false,
}: {
  entry: RankedParticipant;
  variant?: "compact" | "page";
  rank: number;
  selected?: boolean;
  action?: ReactNode;
  firstPlaceTrophy?: boolean;
  hostRanking?: boolean;
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
      className={`session-rank-row${variant === "page" ? ` session-rank-row--page session-rank-row--rank-${Math.min(rank, 4)}${hostRanking ? " session-rank-row--host" : ""}` : ""}${selected ? " session-rank-row--selected" : ""}`}
    >
      <span className="session-rank-row__rank">
        {rank === 1 && (variant !== "page" || firstPlaceTrophy) ? (
          <>
            {variant === "page" && <span className="u-visually-hidden">1</span>}
            <Icon
              name={variant === "page" ? "trophy" : "crown"}
              className="icon--size-17"
              aria-hidden="true"
            />
          </>
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
      <strong className="session-rank-row__score">
        {variant === "page" && hostRanking ? (
          <span key={entry.score} className="session-rank-row__score-value">
            {entry.score}
          </span>
        ) : (
          entry.score
        )}{" "}
        {variant === "page" ? <small>pts</small> : "pts"}
      </strong>
      {action}
    </article>
  );
}
