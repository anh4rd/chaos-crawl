var e=`import ChallengeTile from "./ChallengeTile";
import SelectedChallenge from "./SelectedChallenge";
import CountBadge from "../../components/ui/CountBadge";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import Explainer from "../../components/ui/Explainer";
import Button from "../../components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
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
        <Explainer>
          <Icon name="info" className="icon--size-18" />
          <p>
            <strong>Optional challenges.</strong> Players can complete these
            alongside the main game. Evidence is required, and submissions are
            reviewed and voted on during the live final.
          </p>
        </Explainer>
      )}
      {tab === "secret" && (
        <Explainer tone="pink">
          <Icon name="shield-check" className="icon--size-18" />
          <p>
            <strong>Private individual missions.</strong> Create the missions
            now; assign them to actual players only after those players have
            joined the game. Evidence is required.
          </p>
        </Explainer>
      )}
      {tab === "main" && (
        <Explainer>
          <Icon name="info" className="icon--size-18" />
          <p>
            <strong>Challenge library.</strong> Browse, create and favourite
            ideas here. Favouriting does not add a challenge to the running
            order; add it from Schedule when you are ready.
          </p>
        </Explainer>
      )}
      <div
        className={\`challenge-library__columns\${tab === "main" ? " challenge-library__columns--single" : ""}\`}
      >
        {tab !== "main" && (
          <ContentPanel variant="selection">
            <PanelHeading>
              <div>
                <h3>
                  {tab === "side"
                    ? "Selected side challenges"
                    : "Selected secret missions"}
                </h3>
                <small>Selected items for this game.</small>
              </div>
              <CountBadge>{selectedIds.length}</CountBadge>
            </PanelHeading>
            {selectedIds.map((taskId, index) => {
              const task = allTasks.find((t) => t.id === taskId);
              if (!task) return null;
              return (
                <SelectedChallenge
                  key={taskId}
                  task={task}
                  index={index}
                  count={selectedIds.length}
                  tab={tab}
                  setDragged={setDragged}
                  dropTask={dropTask}
                  moveTask={moveTask}
                  selectTask={selectTask}
                />
              );
            })}
          </ContentPanel>
        )}
        <ContentPanel variant="library" id="cc-task-library">
          <PanelHeading>
            <div>
              <h3>Challenge library</h3>
              <small>Favourite tasks first, then filter and add.</small>
            </div>
            <Button
              variant="setup-filter"
              fullWidth={false}
              className={\`\${favouritesOnly ? " btn--setup-filter-active" : ""}\`}
              aria-pressed={favouritesOnly}
              onClick={() => setFavouritesOnly((v) => !v)}
            >
              <Icon name="heart" className="icon--size-14" /> Favourites
            </Button>
          </PanelHeading>
          <input
            className="search-control"
            aria-label="Search challenges"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges…"
          />
          <div className="challenge-library__filters">
            <select
              aria-label="Filter challenges by vibe"
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
              aria-label="Filter challenges by accessibility"
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
          <div className="challenge-library__results">
            {visibleTasks.map((task) => {
              const selected = selectedIds.includes(task.id);
              const saved = favourites.some(
                (f) => f.item_type === "task" && f.item_id === task.id,
              );
              return (
                <ChallengeTile
                  key={task.id}
                  task={task}
                  tab={tab}
                  selected={selected}
                  saved={saved}
                  toggleFavourite={toggleFavourite}
                  selectTask={selectTask}
                />
              );
            })}
            {!visibleTasks.length && (
              <p className="muted-copy">
                No matching challenges. Try changing the filters.
              </p>
            )}
          </div>
          <form className="challenge-form" onSubmit={addCustomTask}>
            <strong>Create a custom challenge</strong>
            <input
              aria-label="Custom challenge name"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Challenge name"
            />
            <input
              aria-label="Custom challenge description"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Short description"
            />
            <Button
              variant="setup-secondary"
              fullWidth={false}
              disabled={!customTitle.trim()}
            >
              <Icon name="plus" className="icon--size-15" /> Add custom
              challenge
            </Button>
          </form>
        </ContentPanel>
      </div>
    </>
  );
}
`;export{e as default};