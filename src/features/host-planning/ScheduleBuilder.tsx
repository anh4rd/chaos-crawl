import type { Dispatch, SetStateAction } from "react";
import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { Toggle } from "../../components/ui/Toggle";
import { timePlus } from "../../utils/dateTime";
import { type ScheduleItem, type SetupForm, type Task } from "./types";

interface ScheduleBuilderProps {
  calculatedEnd: string;
  form: SetupForm;
  update: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
  liveFinalMinutes: number;
  sideReviewCount: number;
  sideRewardPoints: number;
  addTaskToSchedule: (taskId: string) => void;
  allTasks: Task[];
  addScheduleItem: (type: "break" | "challenge") => void;
  setDragged: Dispatch<SetStateAction<string | null>>;
  dragged: string | null;
  updateScheduleItem: (itemId: string, patch: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (itemId: string) => void;
}

export default function ScheduleBuilder({
  calculatedEnd,
  form,
  update,
  liveFinalMinutes,
  sideReviewCount,
  sideRewardPoints,
  addTaskToSchedule,
  allTasks,
  addScheduleItem,
  setDragged,
  dragged,
  updateScheduleItem,
  deleteScheduleItem,
}: ScheduleBuilderProps) {
  return (
    <section className="cc-section-card">
      <div className="cc-schedule-top">
        <div>
          <h3>Event timeline</h3>
          <p>
            Breaks are inserted automatically. Change durations or move tasks to
            adjust the running order.
          </p>
        </div>
        <div className="cc-end-time">
          <small>Estimated finish</small>
          <strong>{calculatedEnd}</strong>
        </div>
      </div>
      <div className="cc-form-grid">
        <Field label="Default break between challenges">
          <select
            value={form.breakMinutes}
            onChange={(e) => update("breakMinutes", Number(e.target.value))}
          >
            <option value={0}>No break</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </Field>
        <Field label="Live final duration">
          <select
            value={form.finalDuration}
            onChange={(e) => update("finalDuration", Number(e.target.value))}
          >
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </Field>
      </div>
      {form.sideChallenges && (
        <div className="cc-explainer">
          <Icon name="info" className="icon--size-18" />
          <p>
            <strong>
              Final review and rewards add {liveFinalMinutes} minutes.
            </strong>{" "}
            {form.finalDuration} minutes for the live final, plus{" "}
            {sideReviewCount} side-challenge{" "}
            {sideReviewCount === 1 ? "review" : "reviews"} at 5 minutes each. Up
            to {sideRewardPoints} challenge points are available to award.
          </p>
        </div>
      )}
      <div className="cc-schedule-actions">
        <Field label="Add a challenge">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addTaskToSchedule(e.target.value);
              e.currentTarget.value = "";
            }}
          >
            <option value="">Choose from challenge library…</option>
            {allTasks
              .filter((t) => t.kind === "main")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
        <button
          type="button"
          className="cc-secondary"
          onClick={() => addScheduleItem("challenge")}
        >
          <Icon name="plus" className="icon--size-15" /> Create challenge
        </button>
        <button
          type="button"
          className="cc-secondary"
          onClick={() => addScheduleItem("break")}
        >
          <Icon name="plus" className="icon--size-15" /> Add break
        </button>
      </div>
      <div className="cc-schedule-list">
        {form.schedule.map((item, index) => {
          const start = form.schedule
            .slice(0, index)
            .reduce((m, x) => m + x.duration, 0);
          return (
            <article
              className={`cc-schedule-item type-${item.type}`}
              key={item.id}
              draggable={item.type === "challenge"}
              onDragStart={() => setDragged(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragged || dragged === item.id) return;
                const a = [...form.schedule];
                const from = a.findIndex((x) => x.id === dragged);
                const to = a.findIndex((x) => x.id === item.id);
                if (from >= 0 && to >= 0) {
                  const [moved] = a.splice(from, 1);
                  a.splice(to, 0, moved);
                  update("schedule", a);
                }
                setDragged(null);
              }}
            >
              <div className="cc-schedule-time">
                <strong>
                  {item.type === "pregame"
                    ? "BEFORE"
                    : timePlus(form.startTime, start)}
                </strong>
                <small>
                  {item.type === "pregame"
                    ? "Before arrival"
                    : `${item.duration} min`}
                </small>
              </div>
              <div className="cc-schedule-detail">
                <span className="cc-schedule-type">
                  {item.type === "teams"
                    ? "TEAM SELECTION"
                    : item.type.toUpperCase()}
                </span>
                <>
                  {item.type === "challenge" ? (
                    <input
                      className="cc-schedule-title-edit"
                      aria-label={`Edit ${item.title}`}
                      value={item.title}
                      onChange={(e) =>
                        updateScheduleItem(item.id, {
                          title: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <strong>{item.title}</strong>
                  )}
                  {item.taskId && (
                    <small>
                      {allTasks.find((t) => t.id === item.taskId)?.prep}
                    </small>
                  )}
                  {item.taskId &&
                    !!allTasks.find((t) => t.id === item.taskId)?.equipment
                      .length && (
                      <small>
                        Equipment:{" "}
                        {allTasks
                          .find((t) => t.id === item.taskId)
                          ?.equipment.join(", ")}
                      </small>
                    )}
                </>
              </div>
              {item.type !== "pregame" && (
                <label className="cc-duration-edit">
                  Duration
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={item.duration}
                    onChange={(e) =>
                      updateScheduleItem(item.id, {
                        duration: Math.max(1, Number(e.target.value)),
                      })
                    }
                  />
                </label>
              )}
              <button
                type="button"
                className="cc-icon-button"
                title={`Delete ${item.title}`}
                aria-label={`Delete ${item.title}`}
                onClick={() => deleteScheduleItem(item.id)}
              >
                <Icon name="trash2" className="icon--size-15" />
              </button>
              {item.type === "challenge" && (
                <div className="cc-schedule-move">
                  <button
                    onClick={() => {
                      const next = form.schedule[index - 1];
                      if (next?.type === "challenge") {
                        const a = [...form.schedule];
                        [a[index - 1], a[index]] = [a[index], a[index - 1]];
                        update("schedule", a);
                      }
                    }}
                  >
                    <Icon name="arrow-up" className="icon--size-14" />
                  </button>
                  <button
                    onClick={() => {
                      const next = form.schedule[index + 1];
                      if (next?.type === "challenge") {
                        const a = [...form.schedule];
                        [a[index + 1], a[index]] = [a[index], a[index + 1]];
                        update("schedule", a);
                      }
                    }}
                  >
                    <Icon name="arrow-down" className="icon--size-14" />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="cc-explainer">
        <Icon name="info" className="icon--size-18" />
        <p>
          <strong>Flexible schedule.</strong> If a task overruns, the next
          breaks and challenges can be pushed back automatically. The host can
          override the schedule during the live game. Enable strict scheduling
          to turn on challenge timers.
        </p>
      </div>
      <Toggle
        title="Follow a strict schedule"
        detail="Enable countdown timers for timed challenges."
        checked={form.strictSchedule}
        onChange={(v) => {
          update("strictSchedule", v);
          update("challengeTimers", v);
        }}
      />
      <Toggle
        title="Autoplay rounds"
        detail="Automatically advance when each scheduled task ends."
        checked={form.autoplay}
        onChange={(v) => update("autoplay", v)}
      />
      <Toggle
        title="WhatsApp timing reminders"
        detail="Prepare timed reminders for players. Automatic sending needs a WhatsApp messaging integration."
        checked={form.whatsappReminders}
        onChange={(v) => update("whatsappReminders", v)}
      />
    </section>
  );
}
