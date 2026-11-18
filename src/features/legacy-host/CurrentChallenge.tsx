import Icon from "../../components/ui/Icon";
import type { CurrentChallengeModel } from "./types";

export default function CurrentChallenge({
  currentChallenge,
  submissionCount,
  onReview,
}: CurrentChallengeModel) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="radio" className="icon--size-14" /> NOW
        </span>
        {currentChallenge && (
          <span className="host-v2__status host-v2__status--live">
            Live challenge
          </span>
        )}
      </div>
      {currentChallenge ? (
        <>
          <div className="host-v2__challenge-title-row">
            <div className="host-v2__challenge-art">
              <Icon name="flag" className="icon--size-28" />
            </div>
            <div className="host-v2__grow">
              <h2>{currentChallenge.title}</h2>
              <p>
                {currentChallenge.description ||
                  "No extra instructions for this challenge."}
              </p>
            </div>
            <span className="host-v2__points">
              +{currentChallenge.points} pts
            </span>
          </div>
          <div className="host-v2__meta-row">
            <span>
              <Icon name="check-circle2" className="icon--size-15" />{" "}
              {submissionCount} {"submissions"}
            </span>
            <button
              type="button"
              className="host-v2__text-button"
              onClick={onReview}
            >
              {"Review"} <Icon name="chevron-right" className="icon--size-16" />
            </button>
          </div>
        </>
      ) : (
        <div className="host-v2__empty">
          <h2>No challenge is live yet</h2>
          <p>Reveal the first challenge when everyone is ready.</p>
        </div>
      )}
    </section>
  );
}
