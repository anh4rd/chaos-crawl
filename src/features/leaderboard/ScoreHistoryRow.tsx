import type { ScoreEvent } from "../../types/database";

export function ScoreHistoryRow({ event }: { event: ScoreEvent }) {
  const awardedDate = event.awarded_at ? new Date(event.awarded_at) : null;

  return (
    <div className="rounded-xl border border-pink-500/50 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{event.challenge_title}</h3>

          <p className="mt-1 text-xs uppercase opacity-70">
            {event.challenge_type}
          </p>

          {event.reason && <p className="mt-2 text-sm">{event.reason}</p>}

          {awardedDate && (
            <p className="mt-2 text-xs opacity-50">
              {awardedDate.toLocaleString()}
            </p>
          )}
        </div>

        <strong className="text-xl">
          {event.points > 0 ? "+" : ""}

          {event.points}
        </strong>
      </div>
    </div>
  );
}
