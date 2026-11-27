import Explainer from "../../components/ui/Explainer";
import ContentPanel from "../../components/ui/ContentPanel";
import Button from "../../components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { Toggle } from "../../components/ui/Toggle";
import ChallengeTypeActions from "./ChallengeTypeActions";
import { type SetupForm, type Task, type TaskKind } from "./types";

interface PlayerInvitesProps {
  form: SetupForm;
  update: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
  preparation: Task[];
  setPreGameTask: (taskId: string, enabled?: boolean) => void;
  allTasks: Task[];
  customTitle: string;
  customDesc: string;
  setCustomTitle: Dispatch<SetStateAction<string>>;
  setCustomDesc: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  changeType: (task: Task, kind: TaskKind) => void;
}

export default function PlayerInvites({
  form,
  update,
  preparation,
  setPreGameTask,
  allTasks,
  customTitle,
  customDesc,
  setCustomTitle,
  setCustomDesc,
  setNotice,
  changeType,
}: PlayerInvitesProps) {
  return (
    <ContentPanel variant="section">
      <Explainer>
        <Icon name="users" className="icon--size-18" />
        <p>
          <strong>Invite players before the event.</strong> Players can join
          early, learn how the app works and see what they need to prepare. The
          demo uses sample tasks, never your actual game challenges.
        </p>
      </Explainer>
      <Toggle
        title="Allow players to join before the event"
        detail="Create a pre-event player lobby and shareable invite."
        checked={form.inviteBeforeEvent}
        onChange={(v) => update("inviteBeforeEvent", v)}
      />
      <Toggle
        title="Include an app demo"
        detail="Show a demo video or guided walkthrough using sample challenges."
        checked={form.demoEnabled}
        onChange={(v) => update("demoEnabled", v)}
      />
      <Field label="Game rules">
        <textarea
          rows={4}
          value={form.rules}
          onChange={(e) => update("rules", e.target.value)}
        />
      </Field>
      <div className="preparation-list">
        <h3>What players need to prepare</h3>
        {preparation.length ? (
          preparation.map((t) => (
            <div key={t.id}>
              <strong>{t.title}</strong>
              <p>{t.prep}</p>
              <ChallengeTypeActions task={t} onChange={changeType} />
            </div>
          ))
        ) : (
          <p className="muted-copy">
            No preparation notes yet. Add prep details to a challenge to show
            them here.
          </p>
        )}
      </div>
      <div className="preparation-list">
        <h3>Pre-game challenge</h3>
        <Toggle
          title="Add a challenge to complete before arriving"
          detail="This appears as a main challenge in the player pre-event portal."
          checked={form.preGameEnabled}
          onChange={(v) => {
            update("preGameEnabled", v);
            if (!v)
              update(
                "schedule",
                form.schedule.filter(
                  (item) =>
                    item.type !== "pregame" && item.type !== "pregame-review",
                ),
              );
            else if (form.preGameTaskId)
              setPreGameTask(form.preGameTaskId, true);
          }}
        />
        {form.preGameEnabled && (
          <>
            <Field label="Choose pre-game task">
              <select
                value={form.preGameTaskId}
                onChange={(e) => setPreGameTask(e.target.value)}
              >
                <option value="">Choose a task</option>
                {allTasks
                  .filter((t) => t.kind === "main")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </Field>
            <form
              className="challenge-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!customTitle.trim()) return;
                const task: Task = {
                  id: `pregame-${Date.now()}`,
                  title: customTitle.trim(),
                  description:
                    customDesc.trim() || "Complete this task before arriving.",
                  kind: "main",
                  minutes: 10,
                  points: 10,
                  vibe: ["creative"],
                  accessibility: ["seated-option"],
                  equipment: [],
                  setup: "No special setup.",
                  prep: "Complete before the event.",
                  evidenceRequired: true,
                  preGame: true,
                  tags: ["Pre-game"],
                };
                update("customTasks", [...form.customTasks, task]);
                update("preGameTaskId", task.id);
                setCustomTitle("");
                setCustomDesc("");
                setNotice("Pre-game task created.");
              }}
            >
              <strong>Create a pre-game task</strong>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Task name"
              />
              <input
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="What should players do?"
              />
              <Button
                variant="setup-secondary"
                fullWidth={false}
                disabled={!customTitle.trim()}
              >
                <Icon name="plus" className="icon--size-15" /> Create pre-game
                task
              </Button>
            </form>
          </>
        )}
        <small>
          Examples: dress most like the host, make the best entrance, or bring
          the best item. Players can submit before the event; main challenge
          evidence remains optional unless the host explicitly requests it.
        </small>
      </div>
      <div className="preparation-list">
        <h3>Secret mission assignment</h3>
        <p>
          Missions are created now but recipients are selected only after
          players have joined. Choose how assignment should work at that point.
        </p>
        <Field label="Assignment method">
          <select
            value={form.secretAssignment}
            onChange={(e) =>
              update("secretAssignment", e.target.value as "auto" | "host")
            }
          >
            <option value="auto">
              Automatically assign after players join
            </option>
            <option value="host">Host assigns after players join</option>
          </select>
        </Field>
      </div>
      <div className="invite-placeholder">
        <Icon name="info" className="icon--size-18" />
        <p>
          The invite portal settings are saved with this plan. A shareable
          pre-event link is generated when the game session is created; it will
          show the demo, rules and preparation brief, not the selected challenge
          library.
        </p>
      </div>
    </ContentPanel>
  );
}
