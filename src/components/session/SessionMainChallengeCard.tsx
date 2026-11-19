import type { ReactNode } from "react";
import { challengeIcon } from "../../lib/challengeVisuals";
import ControlRow from "../ui/ControlRow";
import TimerReadout from "../ui/TimerReadout";

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
              <h2>
                <span
                  className="main-challenge__title-outline"
                  aria-hidden="true"
                >
                  {title}
                </span>
                <span className="main-challenge__title-fill">{title}</span>
              </h2>
            </div>
          </div>
          <div className="main-challenge__description">{description}</div>
        <div className="main-challenge__meta">
          <ControlRow variant="timer">
            <TimerReadout label={timerCaption} value={timerLabel} />
          </ControlRow>
        </div>
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
      
      
    </section>
  );
}
