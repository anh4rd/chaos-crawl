import type { SideChallengeItemModel } from "./types";

export default function SideChallengeItem({
  challenge,
}: {
  challenge: SideChallengeItemModel;
}) {
  return (
    <article className="host-v2__side-card">
      <div className="host-v2__side-card-top">
        <h3>{challenge.title}</h3>
        <span className="host-v2__points">+{challenge.points} pts</span>
      </div>
      <p>{challenge.description}</p>
      <div className="host-v2__side-card-bottom">
        <span className="host-v2__muted">
          {challenge.completionCount} completions recorded
        </span>
        <button
          type="button"
          className="host-v2__small-action"
          onClick={challenge.onReview}
        >
          Review
        </button>
      </div>
    </article>
  );
}
