var e=`import TimelineItem from "./TimelineItem";
import Explainer from "../../components/ui/Explainer";
import FormGrid from "../../components/ui/FormGrid";
import ContentPanel from "../../components/ui/ContentPanel";
import Button from "../../components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { timePlus } from "../../utils/dateTime";
import type { reviewScheduleItem } from "../../lib/reviewSchedule";
import { Toggle } from "../../components/ui/Toggle";
import {
  type ScheduleItem,
  type SetupForm,
  type Task,
  type TaskKind,
} from "./types";

interface ScheduleBuilderProps {
  calculatedEnd: string;
  form: SetupForm;
  update: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
  liveFinalMinutes: number;
  reviewStage: ReturnType<typeof reviewScheduleItem>;
  sideReviewCount: number;
  sideRewardPoints: number;
  addTaskToSchedule: (taskId: string) => void;
  allTasks: Task[];
  challengeArtUrls: Record<string, string>;
  uploadChallengeIcon: (taskId: string, file: File) => void | Promise<void>;
  clearChallengeArt: (taskId: string) => void;
  selectChallengeEmoji: (taskId: string, hexcode: string | null) => void;
  addScheduleItem: (type: "break" | "challenge") => void;
  setDragged: Dispatch<SetStateAction<string | null>>;
  dragged: string | null;
  updateScheduleItem: (itemId: string, patch: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (itemId: string) => void;
  changeType: (task: Task, kind: TaskKind) => void;
  changeUnlinkedType: (item: ScheduleItem, kind: TaskKind) => void;
}

export default function ScheduleBuilder({
  calculatedEnd,
  form,
  update,
  liveFinalMinutes,
  reviewStage,
  sideReviewCount,
  sideRewardPoints,
  addTaskToSchedule,
  allTasks,
  challengeArtUrls,
  uploadChallengeIcon,
  clearChallengeArt,
  selectChallengeEmoji,
  addScheduleItem,
  setDragged,
  dragged,
  updateScheduleItem,
  deleteScheduleItem,
  changeType,
  changeUnlinkedType,
}: ScheduleBuilderProps) {
  return (
    <ContentPanel variant="section">
      <div className="timeline-header">
        <div>
          <h3>Event timeline</h3>
          <p>
            Breaks are inserted automatically. Change durations or move tasks to
            adjust the running order. Changing a challenge to another type
            removes its scheduled entries.
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
              artUrl={item.taskId ? challengeArtUrls[item.taskId] : undefined}
              showEmojiPicker={
                item.type === "challenge" &&
                Boolean(item.taskId) &&
                form.schedule.findIndex(
                  (scheduled) => scheduled.taskId === item.taskId,
                ) === index
              }
              onUploadIcon={uploadChallengeIcon}
              onClearIcon={clearChallengeArt}
              onSelectEmoji={selectChallengeEmoji}
              dragged={dragged}
              setDragged={setDragged}
              onReorder={(items) => update("schedule", items)}
              onPatch={updateScheduleItem}
              onDelete={deleteScheduleItem}
              onChangeType={changeType}
              onChangeUnlinkedType={changeUnlinkedType}
            />
          );
        })}
        {reviewStage && (
          <article className="schedule-item schedule-item--final">
            <div className="schedule-item__time">
              <strong>
                {timePlus(
                  form.startTime,
                  form.schedule.reduce((sum, item) => sum + item.duration, 0),
                )}
              </strong>
              <small>
                {reviewStage.duration
                  ? \`\${reviewStage.duration} min estimated for side challenges\`
                  : "Duration not set"}
              </small>
            </div>
            <div className="schedule-item__detail">
              <span className="schedule-item__type">FINAL REVIEW</span>
              <strong>{reviewStage.title}</strong>
              {form.secretMissions && (
                <small>Secret mission review time is not included.</small>
              )}
              <small>Start each review from the host controls.</small>
            </div>
          </article>
        )}
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
`;export{e as default};