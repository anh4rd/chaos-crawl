var e=`import type { ScoreEvent } from "../../types/database";

export function ScoreHistoryRow({ event }: { event: ScoreEvent }) {
  const awardedDate = event.awarded_at ? new Date(event.awarded_at) : null;

  return (
    <div className="score-history">
      <div className="score-history__row">
        <div>
          <h3 className="score-history__title">{event.challenge_title}</h3>

          <p className="score-history__type">{event.challenge_type}</p>

          {event.reason && (
            <p className="score-history__reason">{event.reason}</p>
          )}

          {awardedDate && (
            <p className="score-history__date">
              {awardedDate.toLocaleString()}
            </p>
          )}
        </div>

        <strong className="score-history__points">
          {event.points > 0 ? "+" : ""}

          {event.points}
        </strong>
      </div>
    </div>
  );
}
`;export{e as default};