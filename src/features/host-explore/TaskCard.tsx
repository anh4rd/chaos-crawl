import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import PlusMark from "./PlusMark";

import type { TaskCardModel } from "./viewTypes";

export default function TaskCard({
  task,
  saved,
  busy,
  onToggleSaved,
  onAdd,
  adminActions,
}: TaskCardModel) {
  let kindLabel = "Secret mission";
  if (task.kind === "main") kindLabel = "Main challenge";
  else if (task.kind === "side") kindLabel = "Side challenge";
  let setupLabel = "Some prep";
  if (task.setup === "none") setupLabel = "No kit";
  else if (task.setup === "basic") setupLabel = "Basic kit";

  return (
    <Card
      as="article"
      variant="idea"
      header={
        <>
          <Badge variant={`idea-${task.kind}`}>{kindLabel}</Badge>
          <button
            type="button"
            className={`host-explore-save${saved ? " is-saved" : ""}`}
            disabled={busy}
            onClick={() => onToggleSaved()}
            aria-label={saved ? `Unsave ${task.title}` : `Save ${task.title}`}
            title={saved ? "Saved" : "Save for later"}
          >
            {saved ? (
              <Icon name="bookmark-check" className="icon--size-18" />
            ) : (
              <Icon name="heart" className="icon--size-18" />
            )}
          </button>
        </>
      }
    >
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div className="host-explore-metadata">
        {task.prepMinutes || task.performanceMinutes ? (
          <>
            <span>
              <Icon name="clock3" className="icon--size-14" />
              Prep {task.prepMinutes ?? 0} min
            </span>
            <span>
              <Icon name="clock3" className="icon--size-14" />
              Performance {task.performanceMinutes ?? 0} min
            </span>
          </>
        ) : (
          <span>
            <Icon name="clock3" className="icon--size-14" />
            {task.minutes} min
          </span>
        )}
        <span>
          <Icon name="sparkles" className="icon--size-14" />
          {task.points} points
        </span>
        <span>
          <Icon name="wallet" className="icon--size-14" />
          {setupLabel}
        </span>
      </div>
      <div className="host-explore-tags">
        {task.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {adminActions && (
        <div className="host-community-review-actions host-explore-admin-actions">
          <Button
            type="button"
            variant="comic-secondary"
            fullWidth={false}
            onClick={() => adminActions.onEdit()}
          >
            Edit challenge
          </Button>
          <Button
            type="button"
            variant="comic-secondary"
            fullWidth={false}
            disabled={adminActions.busy}
            onClick={() => adminActions.onDelete()}
          >
            Delete
          </Button>
        </div>
      )}
      <div className="host-explore-use-options">
        <Button
          type="button"
          variant="comic-primary"
          fullWidth={false}
          onClick={() => onAdd("main")}
        >
          <PlusMark /> Add as main
        </Button>
        <Button
          type="button"
          variant="comic-secondary"
          fullWidth={false}
          onClick={() => onAdd("side")}
        >
          <PlusMark /> Add as side
        </Button>
      </div>
    </Card>
  );
}
