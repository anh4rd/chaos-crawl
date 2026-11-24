import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import type { SessionProfile, SessionRole } from "./types";

export function SessionPlayerProfile({
  viewerRole,
  name,
  subtitle,
  avatarUrl,
  score,
  rank,
  badge,
  showScore = true,
}: SessionProfile & { viewerRole: SessionRole }) {
  return (
    <header
      className="session-profile"
      data-viewer-role={viewerRole}
      data-tour="player-profile"
    >
      <span className="session-profile__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </span>
      <div className="session-profile__copy">
        <h1>{name}</h1>
        <p>
          {subtitle}
          {badge ? ` · ${badge}` : ""}
        </p>
      </div>
      {showScore && (
        <div className="session-profile__score">
          <strong>
            <Icon name="star" className="icon--size-18" aria-hidden="true" />
            {score}
          </strong>
          <span>
            <Icon name="trophy" className="icon--size-17" aria-hidden="true" />#
            {rank ?? "—"}
          </span>
        </div>
      )}
      {viewerRole === "host" && (
        <Link className="session-profile__hub" to="/host">
          Hub ↗
        </Link>
      )}
    </header>
  );
}
