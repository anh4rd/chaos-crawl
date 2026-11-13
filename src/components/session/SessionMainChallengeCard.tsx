import type { ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { challengeIcon } from "../../lib/challengeVisuals";

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

export default function SessionMainChallengeCard({ viewerRole, title, description, points, round, roundCount, durationMinutes, timerLabel, timerCaption, action, children, actionTourTarget }: SessionMainChallengeCardProps) {
  return <section className="cc-player-challenge-card" data-viewer-role={viewerRole} data-tour="player-challenge" aria-label={`Main challenge · ${durationMinutes} minute allowance`}>
    <div className="cc-player-challenge-heading-row">
      <div className="cc-player-challenge-heading">
        <div className="cc-player-challenge-heading-kindtitle"><span className="cc-player-challenge-kind">MAIN CHALLENGE</span><div><h2>{title}</h2></div></div>
        <div className="cc-challenge-description">{description}</div>
      </div>
      <div className="cc-player-challenge-top-right">
        <span className="cc-player-round-chip">ROUND {round} / {roundCount}</span>
        <span className="cc-player-challenge-award">+{points} POINTS</span>
        <div className="cc-player-challenge-art" aria-hidden="true">{challengeIcon(title, description)}</div>
      </div>
    </div>
    <div className="cc-player-challenge-bottom">
      <div className="cc-player-challenge-meta"><span className="cc-player-time-chip"><span>{timerCaption}</span><strong><Clock3 size={15}/>{timerLabel}</strong></span></div>
      <div className="cc-player-challenge-actions" data-tour={actionTourTarget}>{action ?? children}</div>
    </div>
  </section>;
}
