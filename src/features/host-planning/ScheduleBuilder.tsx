import TimelineItem from "./TimelineItem";
import Explainer from "../../components/ui/Explainer";
import FormGrid from "../../components/ui/FormGrid";
import ContentPanel from "../../components/ui/ContentPanel";
import Button from "../../components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { Toggle } from "../../components/ui/Toggle";
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
    <ContentPanel variant="section">
      <div className="timeline-header">
        <div>
          <h3>Event timeline</h3>
          <p>
            Breaks are inserted automatically. Change durations or move tasks to
            adjust the running order.
          </p>
        </div>
        <div className="end-time">
          <small>Estimated finish</small>
          <strong>{calculatedEnd}</strong>
        </div>
      </div>
      <FormGrid>
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
      </FormGrid>
      {form.sideChallenges && (
        <Explainer>
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
        </Explainer>
      )}
      <div className="timeline-actions">
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
        <Button
          type="button"
          variant="setup-secondary"
          fullWidth={false}
          onClick={() => addScheduleItem("challenge")}
        >
          <Icon name="plus" className="icon--size-15" /> Create challenge
        </Button>
        <Button
          type="button"
          variant="setup-secondary"
          fullWidth={false}
          onClick={() => addScheduleItem("break")}
        >
          <Icon name="plus" className="icon--size-15" /> Add break
        </Button>
      </div>
      <div className="event-timeline">
        {form.schedule.map((item, index) => {
          return (
            <TimelineItem
              key={item.id}
              item={item}
              index={index}
              schedule={form.schedule}
              startTime={form.startTime}
              allTasks={allTasks}
              dragged={dragged}
              setDragged={setDragged}
              onReorder={(items) => update("schedule", items)}
              onPatch={updateScheduleItem}
              onDelete={deleteScheduleItem}
            />
          );
        })}
      </div>
      <Explainer>
        <Icon name="info" className="icon--size-18" />
        <p>
          <strong>Flexible schedule.</strong> If a task overruns, the next
          breaks and challenges can be pushed back automatically. The host can
          override the schedule during the live game. Enable strict scheduling
          to turn on challenge timers.
        </p>
      </Explainer>
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
    </ContentPanel>
  );
}
