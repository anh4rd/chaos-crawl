import type { RoundProgressModel } from "./types";

export default function RoundProgress({
  roundLabel,
  revealedCount,
  totalCount,
  progressPercent,
}: RoundProgressModel) {
  return (
    <section className="host-v2__round-overview">
      <div className="host-v2__section-heading">
        <div>
          <p className="host-v2__eyebrow">GAME PROGRESS</p>
          <h2>{roundLabel}</h2>
        </div>
        <span className="host-v2__progress-number">
          {revealedCount}
          {" /"} {totalCount}
        </span>
      </div>
      <div className="host-v2__progress">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  );
}
