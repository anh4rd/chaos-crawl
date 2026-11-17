import type { ReactNode } from "react";
import { challengeIcon } from "../../lib/challengeVisuals";

export default function SessionChallengeCard({
  id,
  kind = "side",
  title,
  description,
  points,
  children,
}: {
  id: string;
  kind?: "side" | "secret";
  title: string;
  description: string;
  points: number;
  children?: ReactNode;
}) {
  return (
    <article className="session-challenge-card" id={`cc-side-challenge-${id}`}>
      <header className="session-challenge-card__heading">
        <span aria-hidden="true">{challengeIcon(title, description)}</span>
        <div>
          <h3>{title}</h3>
          <strong>
            {kind === "side" ? "Final vote bonus: " : "Mission reward: "}+
            {points} pts
          </strong>
        </div>
      </header>
      <p>{description}</p>
      {children}
    </article>
  );
}
