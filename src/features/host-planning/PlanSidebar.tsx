import Icon from "../../components/ui/Icon";
import { tabItems } from "./catalog";
import type { BuilderTab } from "./types";
export default function PlanSidebar({
  stage,
  tab,
  onBasics,
  onTab,
  mainCount,
  sideCount,
  secretCount,
}: {
  stage: "create" | "build";
  tab: BuilderTab;
  onBasics: () => void;
  onTab: (tab: BuilderTab) => void;
  mainCount: number;
  sideCount: number;
  secretCount: number;
}) {
  return (
    <nav className="setup-sidebar" aria-label="Game setup steps">
      <div className="setup-sidebar__title">YOUR GAME</div>
      <button
        type="button"
        className={`setup-step${stage === "create" ? " setup-step--active" : " setup-step--done"}`}
        onClick={onBasics}
      >
        <span className="setup-step__number">
          {stage === "build" ? (
            <Icon name="check" className="icon--size-15" />
          ) : (
            "1"
          )}
        </span>
        <span>
          <strong>Game basics</strong>
          <small>Name, date and player count</small>
        </span>
      </button>
      <div className="setup-sidebar__divider" />
      {stage === "create" ? (
        <div className="setup-step--next">
          <span className="setup-step__number">2</span>
          <span>
            <strong>Build your game</strong>
            <small>Add challenges, set the schedule and prepare players.</small>
          </span>
        </div>
      ) : (
        tabItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`setup-step${tab === item.id ? " setup-step--active" : ""}`}
            onClick={() => onTab(item.id)}
          >
            <span className="setup-step__number">{index + 2}</span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </button>
        ))
      )}
      {stage === "build" && (
        <div className="setup-sidebar__summary">
          <strong>{mainCount} main</strong>
          <strong>{sideCount} side</strong>
          <strong>{secretCount} secret</strong>
        </div>
      )}
    </nav>
  );
}
