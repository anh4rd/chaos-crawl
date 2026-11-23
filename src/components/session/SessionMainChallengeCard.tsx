import type { ReactNode } from "react";
import ChallengeArtwork from "../challenge/ChallengeArtwork";
import ControlRow from "../ui/ControlRow";
import TimerReadout from "../ui/TimerReadout";

interface SessionMainChallengeCardProps {
  viewerRole: "player" | "host";
  title: string;
  description: string;
  artUrl?: string | null;
  points: number;
  round: number;
  roundCount: number;
  durationMinutes: number;
  timerLabel: string;
  timerCaption: string;
  action?: ReactNode;
  children?: ReactNode;
  actionTourTarget?: string;
  upcoming?: boolean;
  details?: ReactNode;
}

export default function SessionMainChallengeCard({
  viewerRole,
  title,
  description,
  artUrl,
  points,
  round,
  roundCount,
  durationMinutes,
  timerLabel,
  timerCaption,
  upcoming = false,
  details,
}: SessionMainChallengeCardProps) {
  return (
    <section
      className={`main-challenge${upcoming ? " main-challenge--upcoming" : ""}`}
      data-viewer-role={viewerRole}
      data-tour={upcoming ? undefined : "player-challenge"}
      aria-label={`${upcoming ? "Next main challenge" : "Main challenge"} · ${durationMinutes} minute allowance`}
    >
      <div className="main-challenge__heading-row">
        <div className="main-challenge__heading">
          <div className="main-challenge__kind-title">
            <span className="main-challenge__kind">
              {upcoming ? "NEXT MAIN CHALLENGE" : "MAIN CHALLENGE"}
            </span>
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
          {details}
        </div>
        <div className="main-challenge__summary">
          <span className="main-challenge__round">
            ROUND {round} / {roundCount}
          </span>
          <span className="main-challenge__award">+{points} POINTS</span>
          <div className="main-challenge__art" aria-hidden="true">
            <ChallengeArtwork
              selection={artUrl ?? undefined}
              title={title}
              description={description}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
