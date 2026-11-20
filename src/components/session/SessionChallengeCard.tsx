import type { ReactNode } from "react";
import { challengeIcon } from "../../lib/challengeVisuals";

export default function SessionChallengeCard({
  id,
  kind = "side",
  title,
  description,
  points,
  teamsEnabled = false,
  children,
}: {
  id: string;
  kind?: "side" | "secret";
  title: string;
  description: string;
  points?: number;
  teamsEnabled?: boolean;
  children?: ReactNode;
}) {
  if (kind === "secret") {
    return (
      <article
        className="session-challenge-card session-challenge-card--secret"
        id={`cc-side-challenge-${id}`}
      >
        <header className="session-challenge-card__heading">
          <div className="session-challenge-card__heading-copy">
            <strong className="session-challenge-card__kind">
              SECRET MISSION
            </strong>
            <h3 className="session-challenge-card__title">{title}</h3>
            <strong className="session-challenge-card__reward">
              Mission reward: +{points ?? 0} pts
            </strong>
          </div>
          <span className="session-challenge-card__art" aria-hidden="true">
            {challengeIcon(title, description)}
          </span>
        </header>
        <p>{description}</p>
        {children}
      </article>
    );
  }

  return (
    <article className="session-challenge-card" id={`cc-side-challenge-${id}`}>
      <h3 className="session-challenge-card__title">{title}</h3>
      <p className="session-challenge-card__description">{description}</p>
      {teamsEnabled && (
        <p className="session-challenge-card__team-mode">Compete in teams</p>
      )}
      {children && (
        <div className="session-challenge-card__content">{children}</div>
      )}
    </article>
  );
}
