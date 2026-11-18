import Icon from "../../components/ui/Icon";
import type { ChallengeListItemModel } from "./types";

export default function ChallengeListItem({
  challenge,
  busy,
}: {
  challenge: ChallengeListItemModel;
  busy: boolean;
}) {
  return (
    <article className="host-v2__challenge-list-item">
      <div className="host-v2__list-icon">
        {challenge.past ? (
          <Icon name="check" className="icon--size-17" />
        ) : (
          <Icon name="flag" className="icon--size-17" />
        )}
      </div>
      <div className="host-v2__grow">
        <div className="host-v2__title-line">
          <h3>{challenge.title}</h3>
          {challenge.current && (
            <span className="host-v2__status host-v2__status--live">Live</span>
          )}
          {challenge.scheduled && (
            <span className="host-v2__status host-v2__status--scheduled">
              Scheduled
            </span>
          )}
        </div>
        <p>{challenge.description || "No description added."}</p>
        <span className="host-v2__points-inline">
          +{challenge.points} points
        </span>
      </div>
      <div className="host-v2__row-actions">
        <button
          type="button"
          className="host-v2__small-action"
          disabled={busy || challenge.current}
          onClick={challenge.onReveal}
        >
          {challenge.current ? "Live" : "Reveal"}
        </button>
        {!challenge.current && !challenge.scheduled && (
          <button
            type="button"
            className="host-v2__small-action host-v2__small-action--quiet"
            disabled={busy}
            onClick={challenge.onSchedule}
          >
            Schedule
          </button>
        )}
      </div>
    </article>
  );
}
