var e=`import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import ChallengeArtwork from "../../components/challenge/ChallengeArtwork";
import ChallengeTypeActions from "./ChallengeTypeActions";
import { unlinkedScheduleTask } from "./planModel";
import { timePlus } from "../../utils/dateTime";
import {
  closestOpenMoji,
  closestOpenMojis,
  getOpenMoji,
  OPENMOJI_SELECTION_PREFIX,
  openMojiSelection,
  searchOpenMojis,
  selectedOpenMojiCode,
} from "../../lib/openmoji";
import type { ScheduleItem, Task, TaskKind } from "./types";
export default function TimelineItem({
  item,
  index,
  schedule,
  startTime,
  allTasks,
  artUrl,
  showEmojiPicker,
  onUploadIcon,
  onClearIcon,
  onSelectEmoji,
  dragged,
  setDragged,
  onReorder,
  onPatch,
  onDelete,
  onChangeType,
  onChangeUnlinkedType,
}: {
  item: ScheduleItem;
  index: number;
  schedule: ScheduleItem[];
  startTime: string;
  allTasks: Task[];
  artUrl?: string;
  showEmojiPicker: boolean;
  onUploadIcon: (taskId: string, file: File) => void | Promise<void>;
  onClearIcon: (taskId: string) => void;
  onSelectEmoji: (taskId: string, hexcode: string | null) => void;
  dragged: string | null;
  setDragged: Dispatch<SetStateAction<string | null>>;
  onReorder: (items: ScheduleItem[]) => void;
  onPatch: (id: string, patch: Partial<ScheduleItem>) => void;
  onDelete: (id: string) => void;
  onChangeType: (task: Task, kind: TaskKind) => void;
  onChangeUnlinkedType: (item: ScheduleItem, kind: TaskKind) => void;
}) {
  const [emojiSearch, setEmojiSearch] = useState("");
  const start = schedule
    .slice(0, index)
    .reduce((minutes, row) => minutes + row.duration, 0);
  const task = item.taskId
    ? allTasks.find((candidate) => candidate.id === item.taskId)
    : undefined;
  const unlinkedTask = unlinkedScheduleTask(item);
  const taskId = item.taskId;
  const automaticEmoji = task
    ? closestOpenMoji(item.title, task.description)
    : undefined;
  const selectedEmojiCode = selectedOpenMojiCode(artUrl);
  const uploadedArtwork = Boolean(
    artUrl && !artUrl.startsWith(OPENMOJI_SELECTION_PREFIX),
  );
  const emojiOptions = task
    ? emojiSearch.trim()
      ? searchOpenMojis(emojiSearch, 24)
      : closestOpenMojis(item.title, task.description)
    : [];
  const visibleEmojiOptions =
    selectedEmojiCode &&
    !emojiOptions.some((emoji) => emoji.hexcode === selectedEmojiCode)
      ? [getOpenMoji(selectedEmojiCode), ...emojiOptions].filter(
          (emoji) => emoji !== undefined,
        )
      : emojiOptions;
  return (
    <article
      className={\`schedule-item schedule-item--\${item.type}\`}
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
          {item.type === "pregame" ? "Before arrival" : \`\${item.duration} min\`}
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
              aria-label={\`Edit \${item.title}\`}
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
          {item.taskId && <small>{task?.prep}</small>}
          {task && task.equipment.length > 0 && (
            <small>Equipment: {task.equipment.join(", ")}</small>
          )}
          {item.type === "challenge" && task && (
            <ChallengeTypeActions task={task} onChange={onChangeType} />
          )}
          {unlinkedTask && (
            <ChallengeTypeActions
              task={unlinkedTask}
              onChange={(_, kind) => onChangeUnlinkedType(item, kind)}
            />
          )}
          {showEmojiPicker && task?.kind === "main" && taskId && (
            <div className="schedule-item__artwork">
              <ChallengeArtwork
                selection={artUrl}
                title={item.title}
                description={task.description}
              />
              <details className="schedule-item__emoji-picker">
                <summary>Change emoji</summary>
                <div className="schedule-item__emoji-picker-controls">
                  <label>
                    Search OpenMoji
                    <input
                      type="search"
                      aria-label={\`Search OpenMoji for \${item.title}\`}
                      value={emojiSearch}
                      onChange={(event) =>
                        setEmojiSearch(event.currentTarget.value)
                      }
                    />
                  </label>
                  <button
                    className="schedule-item__emoji-auto"
                    type="button"
                    aria-label={\`Use automatic \${automaticEmoji?.annotation} emoji\`}
                    aria-pressed={!selectedEmojiCode && !uploadedArtwork}
                    onClick={() => onSelectEmoji(taskId, null)}
                  >
                    <ChallengeArtwork
                      title={item.title}
                      description={task.description}
                    />
                    <span>Auto: {automaticEmoji?.annotation}</span>
                  </button>
                  {emojiSearch.trim() && emojiOptions.length === 0 && (
                    <small>No OpenMoji results. Try another word.</small>
                  )}
                  {visibleEmojiOptions.length > 0 && (
                    <div className="schedule-item__emoji-options">
                      {visibleEmojiOptions.map((emoji) => (
                        <button
                          key={emoji.hexcode}
                          className="schedule-item__emoji-option"
                          type="button"
                          aria-label={\`Select \${emoji.annotation} emoji\`}
                          aria-pressed={selectedEmojiCode === emoji.hexcode}
                          onClick={() => onSelectEmoji(taskId, emoji.hexcode)}
                        >
                          <ChallengeArtwork
                            selection={openMojiSelection(emoji.hexcode)}
                            title={emoji.annotation}
                          />
                          <span>{emoji.annotation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <a
                    href="https://openmoji.org/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    OpenMoji by OpenMoji.org · CC BY-SA 4.0
                  </a>
                </div>
              </details>
              <label>
                Upload custom art
                <input
                  type="file"
                  accept="image/*"
                  aria-label={\`Upload custom art for \${item.title}\`}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void onUploadIcon(taskId, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {artUrl && (
                <Button
                  type="button"
                  variant="setup-text"
                  fullWidth={false}
                  onClick={() => onClearIcon(taskId)}
                >
                  Use automatic emoji
                </Button>
              )}
            </div>
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
            aria-label={\`Duration for \${item.title}\`}
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
        title={\`Delete \${item.title}\`}
        aria-label={\`Delete \${item.title}\`}
        onClick={() => onDelete(item.id)}
      >
        <Icon name="trash2" className="icon--size-15" />
      </Button>
      {item.type === "challenge" && (
        <div className="schedule-item__move">
          <Button
            variant="setup-move"
            fullWidth={false}
            aria-label={\`Move \${item.title} up\`}
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
            aria-label={\`Move \${item.title} down\`}
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
`;export{e as default};