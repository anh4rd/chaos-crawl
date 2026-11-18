import Icon from "../../components/ui/Icon";
import type { UpcomingChallengeModel } from "./types";

export default function UpcomingChallenge({
  scheduledChallenge,
  nextChallenge,
  scheduledTime,
  busy,
  revealingNext,
  scheduleMinutes,
  onRevealNext,
  onCancelSchedule,
  onScheduleMinutesChange,
  onScheduleNext,
}: UpcomingChallengeModel) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="arrow-right" className="icon--size-14" /> NEXT
        </span>
        {scheduledTime && (
          <span className="host-v2__status host-v2__status--scheduled">
            <Icon name="clock3" className="icon--size-13" /> {scheduledTime}
          </span>
        )}
      </div>
      {scheduledChallenge ? (
        <div className="host-v2__challenge-title-row">
          <div className="host-v2__challenge-art host-v2__challenge-art--lime">
            <Icon name="calendar-clock" className="icon--size-25" />
          </div>
          <div className="host-v2__grow">
            <h2>{scheduledChallenge.title}</h2>
            <p>{scheduledChallenge.description || "Scheduled challenge"}</p>
            <p className="host-v2__small-note">
              Scheduled to reveal
              {scheduledTime ? ` at ${scheduledTime}` : " soon"}.
            </p>
          </div>
        </div>
      ) : nextChallenge ? (
        <div className="host-v2__challenge-title-row">
          <div className="host-v2__challenge-art host-v2__challenge-art--lime">
            <Icon name="circle-dot" className="icon--size-25" />
          </div>
          <div className="host-v2__grow">
            <h2>{nextChallenge.title}</h2>
            <p>
              {nextChallenge.description ||
                "No extra instructions for this challenge."}
            </p>
            <span className="host-v2__points-inline">
              +{nextChallenge.points} points
            </span>
          </div>
        </div>
      ) : (
        <div className="host-v2__empty">
          <h2>All rounds revealed</h2>
          <p>You've reached the end of the main challenge list.</p>
        </div>
      )}
      <div className="host-v2__actions">
        {nextChallenge && (
          <button
            type="button"
            className="host-v2__button host-v2__button--primary"
            disabled={busy}
            onClick={onRevealNext}
          >
            {revealingNext ? "Revealing…" : "Reveal next challenge"}
            <Icon name="chevron-right" className="icon--size-17" />
          </button>
        )}
        {scheduledChallenge && (
          <button
            type="button"
            className="host-v2__button host-v2__button--subtle"
            disabled={busy}
            onClick={onCancelSchedule}
          >
            <Icon name="x" className="icon--size-16" /> Cancel schedule
          </button>
        )}
      </div>
      {nextChallenge && !scheduledChallenge && (
        <div className="host-v2__schedule-row">
          <label htmlFor="host-v2-schedule">Auto-reveal in</label>
          <input
            id="host-v2-schedule"
            aria-label="Minutes until auto reveal"
            type="number"
            min={1}
            max={240}
            value={scheduleMinutes}
            onChange={(event) => onScheduleMinutesChange(event.target.value)}
          />
          <span>min</span>
          <button
            type="button"
            className="host-v2__icon-button"
            disabled={busy}
            aria-label="Schedule next challenge"
            onClick={onScheduleNext}
          >
            <Icon name="calendar-clock" className="icon--size-17" />
          </button>
        </div>
      )}
    </section>
  );
}
