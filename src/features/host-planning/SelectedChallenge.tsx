import type { Dispatch, SetStateAction } from "react";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import ChallengeArtwork from "../../components/challenge/ChallengeArtwork";
import ChallengeTypeActions from "./ChallengeTypeActions";
import FormLabel from "../../components/ui/FormLabel";
import type { Task, TaskKind } from "./types";
export default function SelectedChallenge({
  task,
  index,
  count,
  tab,
  setDragged,
  dropTask,
  moveTask,
  selectTask,
  changeType,
  changeSecretResponseMode,
}: {
  task: Task;
  index: number;
  count: number;
  tab: "main" | "side" | "secret";
  setDragged: Dispatch<SetStateAction<string | null>>;
  dropTask: (id: string) => void;
  moveTask: (id: string, direction: -1 | 1) => void;
  selectTask: (task: Task) => void;
  changeType: (task: Task, kind: TaskKind) => void;
  changeSecretResponseMode: (task: Task, mode: "media" | "text") => void;
}) {
  return (
    <article
      className="selected-challenge"
      draggable
      onDragStart={() => setDragged(task.id)}
      onDragEnd={() => setDragged(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => dropTask(task.id)}
    >
      <Icon
        name="grip-vertical"
        className="icon--size-17 selected-challenge__grip"
      />
      <div className="selected-challenge__number">{index + 1}</div>
      <span className="selected-challenge__icon" aria-hidden="true">
        <ChallengeArtwork title={task.title} description={task.description} />
      </span>
      <div className="selected-challenge__copy">
        <strong>{task.title}</strong>
        <small>
          {tab === "side"
            ? `${task.points} pts`
            : `${task.minutes} min · ${task.points} pts`}
          {task.preGame ? " · PRE-GAME" : ""}
        </small>
        <ChallengeTypeActions task={task} onChange={changeType} />
        {tab === "secret" && (
          <FormLabel>
            <span>Mission response</span>
            <select
              aria-label={`Mission response for ${task.title}`}
              value={task.secretResponseMode ?? "media"}
              onChange={(event) =>
                changeSecretResponseMode(
                  task,
                  event.target.value === "text" ? "text" : "media",
                )
              }
            >
              <option value="media">Photo/video or completion</option>
              <option value="text">Written answer</option>
            </select>
          </FormLabel>
        )}
      </div>
      <div className="selected-challenge__actions">
        <Button
          variant="setup-move"
          fullWidth={false}
          title="Move up"
          aria-label={`Move ${task.title} up`}
          disabled={index === 0}
          onClick={() => moveTask(task.id, -1)}
        >
          <Icon name="arrow-up" className="icon--size-14" />
        </Button>
        <Button
          variant="setup-move"
          fullWidth={false}
          title="Move down"
          aria-label={`Move ${task.title} down`}
          disabled={index === count - 1}
          onClick={() => moveTask(task.id, 1)}
        >
          <Icon name="arrow-down" className="icon--size-14" />
        </Button>
      </div>
      <Button
        variant="setup-icon"
        fullWidth={false}
        title="Remove"
        aria-label={`Remove ${task.title}`}
        onClick={() => selectTask(task)}
      >
        <Icon name="trash2" className="icon--size-15" />
      </Button>
    </article>
  );
}
