import type { ReactNode } from "react";
import { challengeIcon } from "../../lib/challengeVisuals";
import Icon from "../ui/Icon";

interface SessionMainChallengeCardProps {
  viewerRole: "player" | "host";
  title: string;
  description: string;
  points: number;
  round: number;
  roundCount: number;
  durationMinutes: number;
  timerLabel: string;
  timerCaption: string;
  action?: ReactNode;
  children?: ReactNode;
  actionTourTarget?: string;
}

export default function SessionMainChallengeCard({
  viewerRole,
  title,
  description,
  points,
  round,
  roundCount,
  durationMinutes,
  timerLabel,
  timerCaption,
  action,
  children,
  actionTourTarget,
}: SessionMainChallengeCardProps) {
  return (
    <section
      className="main-challenge"
      data-viewer-role={viewerRole}
      data-tour="player-challenge"
      aria-label={`Main challenge · ${durationMinutes} minute allowance`}
    >
      <div className="main-challenge__heading-row">
        <div className="main-challenge__heading">
          <div className="main-challenge__kind-title">
            <span className="main-challenge__kind">MAIN CHALLENGE</span>
            <div>
              <h2>{title}</h2>
            </div>
          </div>
          <div className="main-challenge__description">{description}</div>
        </div>
        <div className="main-challenge__summary">
          <span className="main-challenge__round">
            ROUND {round} / {roundCount}
          </span>
          <span className="main-challenge__award">+{points} POINTS</span>
          <div className="main-challenge__art" aria-hidden="true">
            {challengeIcon(title, description)}
          </div>
        </div>
      </div>
      <div className="main-challenge__bottom">
        <div className="main-challenge__meta">
          <span className="main-challenge__time">
            <span>{timerCaption}</span>
            <strong>
              <Icon name="clock3" className="icon--size-15" />
              {timerLabel}
            </strong>
          </span>
        </div>
        <div className="main-challenge__actions" data-tour={actionTourTarget}>
          {action ?? children}
        </div>
      </div>
    </section>
  );
}
