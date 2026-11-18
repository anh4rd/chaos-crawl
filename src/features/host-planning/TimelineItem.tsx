import type { Dispatch, SetStateAction } from "react";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import { timePlus } from "../../utils/dateTime";
import type { ScheduleItem, Task } from "./types";
export default function TimelineItem({
  item,
  index,
  schedule,
  startTime,
  allTasks,
  dragged,
  setDragged,
  onReorder,
  onPatch,
  onDelete,
}: {
  item: ScheduleItem;
  index: number;
  schedule: ScheduleItem[];
  startTime: string;
  allTasks: Task[];
  dragged: string | null;
  setDragged: Dispatch<SetStateAction<string | null>>;
  onReorder: (items: ScheduleItem[]) => void;
  onPatch: (id: string, patch: Partial<ScheduleItem>) => void;
  onDelete: (id: string) => void;
}) {
  const start = schedule
    .slice(0, index)
    .reduce((minutes, row) => minutes + row.duration, 0);
  return (
    <article
      className={`schedule-item schedule-item--${item.type}`}
      draggable={item.type === "challenge"}
      onDragStart={() => setDragged(item.id)}
      onDragEnd={() => setDragged(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        if (!dragged || dragged === item.id) return;
        const a = [...schedule];
        const from = a.findIndex((x) => x.id === dragged);
        const to = a.findIndex((x) => x.id === item.id);
        if (from >= 0 && to >= 0) {
          const [moved] = a.splice(from, 1);
          a.splice(to, 0, moved);
          onReorder(a);
        }
        setDragged(null);
      }}
    >
      <div className="schedule-item__time">
        <strong>
          {item.type === "pregame" ? "BEFORE" : timePlus(startTime, start)}
        </strong>
        <small>
          {item.type === "pregame" ? "Before arrival" : `${item.duration} min`}
        </small>
      </div>
      <div className="schedule-item__detail">
        <span className="schedule-item__type">
          {item.type === "teams" ? "TEAM SELECTION" : item.type.toUpperCase()}
        </span>
        <>
          {item.type === "challenge" ? (
            <input
              className="schedule-item__title"
              aria-label={`Edit ${item.title}`}
              value={item.title}
              onChange={(e) =>
                onPatch(item.id, {
                  title: e.target.value,
                })
              }
            />
          ) : (
            <strong>{item.title}</strong>
          )}
          {item.taskId && (
            <small>{allTasks.find((t) => t.id === item.taskId)?.prep}</small>
          )}
          {item.taskId &&
            !!allTasks.find((t) => t.id === item.taskId)?.equipment.length && (
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
        <label className="duration-control">
          Duration
          <input
            type="number"
            min={1}
            max={240}
            aria-label={`Duration for ${item.title}`}
            value={item.duration}
            onChange={(e) =>
              onPatch(item.id, {
                duration: Math.max(1, Number(e.target.value)),
              })
            }
          />
        </label>
      )}
      <Button
        type="button"
        variant="setup-icon"
        fullWidth={false}
        title={`Delete ${item.title}`}
        aria-label={`Delete ${item.title}`}
        onClick={() => onDelete(item.id)}
      >
        <Icon name="trash2" className="icon--size-15" />
      </Button>
      {item.type === "challenge" && (
        <div className="schedule-item__move">
          <Button
            variant="setup-move"
            fullWidth={false}
            aria-label={`Move ${item.title} up`}
            disabled={index === 0}
            onClick={() => {
              if (index > 0) {
                const a = [...schedule];
                [a[index - 1], a[index]] = [a[index], a[index - 1]];
                onReorder(a);
              }
            }}
          >
            <Icon name="arrow-up" className="icon--size-14" />
          </Button>
          <Button
            variant="setup-move"
            fullWidth={false}
            aria-label={`Move ${item.title} down`}
            disabled={index === schedule.length - 1}
            onClick={() => {
              if (index < schedule.length - 1) {
                const a = [...schedule];
                [a[index + 1], a[index]] = [a[index], a[index + 1]];
                onReorder(a);
              }
            }}
          >
            <Icon name="arrow-down" className="icon--size-14" />
          </Button>
        </div>
      )}
    </article>
  );
}
