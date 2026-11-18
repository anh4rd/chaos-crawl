import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import { challengeIcon } from "../../lib/challengeVisuals";
import type { Task } from "./types";
export default function ChallengeTile({
  task,
  tab,
  selected,
  saved,
  toggleFavourite,
  selectTask,
}: {
  task: Task;
  tab: "main" | "side" | "secret";
  selected: boolean;
  saved: boolean;
  toggleFavourite: (task: Task) => Promise<void>;
  selectTask: (task: Task) => void;
}) {
  return (
    <article
      className={`challenge-tile${selected ? " challenge-tile--selected" : ""}`}
    >
      <span className="challenge-tile__icon" aria-hidden="true">
        {challengeIcon(task.title, task.description)}
      </span>
      <div className="challenge-tile__content">
        <div className="challenge-tile__heading">
          <strong>{task.title}</strong>
          <Button
            variant="setup-favourite"
            fullWidth={false}
            className={`${saved ? " btn--setup-favourite-saved" : ""}`}
            onClick={() => void toggleFavourite(task)}
            aria-label={`Favourite ${task.title}`}
            aria-pressed={saved}
          >
            <Icon
              name="heart"
              className="icon--size-16"
              fill={saved ? "currentColor" : "none"}
            />
          </Button>
        </div>
        <p>{task.description}</p>
        <div className="tag-list">
          {tab !== "side" && <span>{task.minutes} min</span>}
          <span>{task.points} pts</span>
          {task.preGame && <span>Pre-game</span>}
          {task.equipment.length > 0 && <span>Equipment</span>}
          {task.evidenceRequired && <span>Evidence required</span>}
        </div>
      </div>
      <Button
        variant="setup-select"
        fullWidth={false}
        className={`${tab === "main" ? (saved ? " btn--setup-select-selected" : "") : selected ? " btn--setup-select-selected" : ""}`}
        aria-pressed={tab === "main" ? saved : selected}
        onClick={() =>
          tab === "main" ? void toggleFavourite(task) : selectTask(task)
        }
      >
        {tab === "main" ? (
          saved ? (
            <>
              <Icon name="check" className="icon--size-14" /> Favourited
            </>
          ) : (
            <>
              <Icon name="heart" className="icon--size-14" /> Favourite
            </>
          )
        ) : selected ? (
          <>
            <Icon name="check" className="icon--size-14" /> Added
          </>
        ) : (
          <>
            <Icon name="plus" className="icon--size-14" /> Add
          </>
        )}
      </Button>
    </article>
  );
}
