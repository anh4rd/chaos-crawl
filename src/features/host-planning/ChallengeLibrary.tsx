import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
import { challengeIcon } from "../../lib/challengeVisuals";
import { vibes } from "./catalog";
import { type Favourite, type Task } from "./types";

interface ChallengeLibraryProps {
  tab: "main" | "side" | "secret";
  selectedIds: string[];
  allTasks: Task[];
  setDragged: Dispatch<SetStateAction<string | null>>;
  dropTask: (targetId: string) => void;
  moveTask: (taskId: string, direction: -1 | 1) => void;
  selectTask: (task: Task) => void;
  favouritesOnly: boolean;
  setFavouritesOnly: Dispatch<SetStateAction<boolean>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  vibeFilter: string;
  setVibeFilter: Dispatch<SetStateAction<string>>;
  accessFilter: string;
  setAccessFilter: Dispatch<SetStateAction<string>>;
  visibleTasks: Task[];
  favourites: Favourite[];
  toggleFavourite: (task: Task) => Promise<void>;
  addCustomTask: (e: FormEvent) => void;
  customTitle: string;
  setCustomTitle: Dispatch<SetStateAction<string>>;
  customDesc: string;
  setCustomDesc: Dispatch<SetStateAction<string>>;
}

export default function ChallengeLibrary({
  tab,
  selectedIds,
  allTasks,
  setDragged,
  dropTask,
  moveTask,
  selectTask,
  favouritesOnly,
  setFavouritesOnly,
  search,
  setSearch,
  vibeFilter,
  setVibeFilter,
  accessFilter,
  setAccessFilter,
  visibleTasks,
  favourites,
  toggleFavourite,
  addCustomTask,
  customTitle,
  setCustomTitle,
  customDesc,
  setCustomDesc,
}: ChallengeLibraryProps) {
  return (
    <>
      {tab === "side" && (
        <div className="cc-explainer">
          <Icon name="info" className="icon--size-18" />
          <p>
            <strong>Optional challenges.</strong> Players can complete these
            alongside the main game. Evidence is required, and submissions are
            reviewed and voted on during the live final.
          </p>
        </div>
      )}
      {tab === "secret" && (
        <div className="cc-explainer cc-explainer--pink">
          <Icon name="shield-check" className="icon--size-18" />
          <p>
            <strong>Private individual missions.</strong> Create the missions
            now; assign them to actual players only after those players have
            joined the game. Evidence is required.
          </p>
        </div>
      )}
      {tab === "main" && (
        <div className="cc-explainer">
          <Icon name="info" className="icon--size-18" />
          <p>
            <strong>Challenge library.</strong> Browse, create and favourite
            ideas here. Favouriting does not add a challenge to the running
            order; add it from Schedule when you are ready.
          </p>
        </div>
      )}
      <div
        className={`cc-builder-columns${tab === "main" ? " cc-library-only" : ""}`}
      >
        {tab !== "main" && (
          <section className="cc-rounds-panel">
            <div className="cc-panel-head">
              <div>
                <h3>
                  {tab === "side"
                    ? "Selected side challenges"
                    : "Selected secret missions"}
                </h3>
                <small>Selected items for this game.</small>
              </div>
              <span className="cc-count">{selectedIds.length}</span>
            </div>
            {selectedIds.map((taskId, index) => {
              const task = allTasks.find((t) => t.id === taskId);
              if (!task) return null;
              return (
                <article
                  key={taskId}
                  className="cc-round-card"
                  draggable
                  onDragStart={() => setDragged(taskId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropTask(taskId)}
                >
                  <Icon
                    name="grip-vertical"
                    className="icon--size-17 cc-grip"
                  />
                  <div className="cc-round-number">{index + 1}</div>
                  <span className="cc-round-task-icon" aria-hidden="true">
                    {challengeIcon(task.title, task.description)}
                  </span>
                  <div className="cc-round-copy">
                    <strong>{task.title}</strong>
                    <small>
                      {tab === "side"
                        ? `${task.points} pts`
                        : `${task.minutes} min · ${task.points} pts`}
                      {task.preGame ? " · PRE-GAME" : ""}
                    </small>
                  </div>
                  <div className="cc-round-actions">
                    <button
                      title="Move up"
                      onClick={() => moveTask(taskId, -1)}
                    >
                      <Icon name="arrow-up" className="icon--size-14" />
                    </button>
                    <button
                      title="Move down"
                      onClick={() => moveTask(taskId, 1)}
                    >
                      <Icon name="arrow-down" className="icon--size-14" />
                    </button>
                  </div>
                  <button
                    className="cc-icon-button"
                    title="Remove"
                    onClick={() => selectTask(task)}
                  >
                    <Icon name="trash2" className="icon--size-15" />
                  </button>
                </article>
              );
            })}
          </section>
        )}
        <section className="cc-library-panel" id="cc-task-library">
          <div className="cc-panel-head">
            <div>
              <h3>Challenge library</h3>
              <small>Favourite tasks first, then filter and add.</small>
            </div>
            <button
              className={`cc-filter-chip${favouritesOnly ? " active" : ""}`}
              onClick={() => setFavouritesOnly((v) => !v)}
            >
              <Icon name="heart" className="icon--size-14" /> Favourites
            </button>
          </div>
          <input
            className="cc-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges…"
          />
          <div className="cc-filter-row">
            <select
              value={vibeFilter}
              onChange={(e) => setVibeFilter(e.target.value)}
            >
              <option value="all">All vibes</option>
              {vibes.map((v) => (
                <option key={v} value={v.toLowerCase()}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
            >
              <option value="all">All accessibility</option>
              <option value="seated-option">Seated option</option>
              <option value="low-noise-option">Low-noise option</option>
              <option value="no-running">No running</option>
              <option value="no-alcohol">No alcohol</option>
              <option value="low-sensory-load">Low sensory load</option>
              <option value="mobility-flexible">Mobility-flexible</option>
              <option value="no-public-interaction">
                No public interaction
              </option>
            </select>
          </div>
          <div className="cc-task-results">
            {visibleTasks.map((task) => {
              const selected = selectedIds.includes(task.id);
              const saved = favourites.some(
                (f) => f.item_type === "task" && f.item_id === task.id,
              );
              return (
                <article
                  className={`cc-task-result${selected ? " selected" : ""}`}
                  key={task.id}
                >
                  <span className="cc-task-result-icon" aria-hidden="true">
                    {challengeIcon(task.title, task.description)}
                  </span>
                  <div className="cc-task-result-main">
                    <div className="cc-task-result-title">
                      <strong>{task.title}</strong>
                      <button
                        className={`cc-heart${saved ? " saved" : ""}`}
                        onClick={() => void toggleFavourite(task)}
                        aria-label="Favourite"
                      >
                        <Icon
                          name="heart"
                          className="icon--size-16"
                          fill={saved ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                    <p>{task.description}</p>
                    <div className="cc-task-tags">
                      {tab !== "side" && <span>{task.minutes} min</span>}
                      <span>{task.points} pts</span>
                      {task.preGame && <span>Pre-game</span>}
                      {task.equipment.length > 0 && <span>Equipment</span>}
                      {task.evidenceRequired && <span>Evidence required</span>}
                    </div>
                  </div>
                  <button
                    className={`cc-select-task${tab === "main" ? (saved ? " selected" : "") : selected ? " selected" : ""}`}
                    onClick={() =>
                      tab === "main"
                        ? void toggleFavourite(task)
                        : selectTask(task)
                    }
                  >
                    {tab === "main" ? (
                      saved ? (
                        <>
                          <Icon name="check" className="icon--size-14" />{" "}
                          Favourited
                        </>
                      ) : (
                        <>
                          <Icon name="heart" className="icon--size-14" />{" "}
                          Favourite
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
                  </button>
                </article>
              );
            })}
            {!visibleTasks.length && (
              <p className="cc-muted">
                No matching challenges. Try changing the filters.
              </p>
            )}
          </div>
          <form className="cc-custom-task" onSubmit={addCustomTask}>
            <strong>Create a custom challenge</strong>
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Challenge name"
            />
            <input
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Short description"
            />
            <button className="cc-secondary" disabled={!customTitle.trim()}>
              <Icon name="plus" className="icon--size-15" /> Add custom
              challenge
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
