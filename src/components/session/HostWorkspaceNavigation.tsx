import Icon, { type IconName } from "../ui/Icon";
import { handleTabListKeyDown } from "../ui/tabListNavigation";

export interface HostWorkspaceNavigationItem {
  id: string;
  label: string;
  icon: IconName;
}

export default function HostWorkspaceNavigation({
  items,
  active,
  idPrefix,
  onSelect,
}: {
  items: readonly HostWorkspaceNavigationItem[];
  active: string;
  idPrefix: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="host-workspace-nav"
      role="tablist"
      aria-label="Host workspace sections"
      aria-orientation="horizontal"
      tabIndex={-1}
      onKeyDown={handleTabListKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`host-workspace-nav__tab${selected ? " host-workspace-nav__tab--active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <Icon
              name={item.icon}
              className="host-workspace-nav__icon"
              aria-hidden="true"
            />
            <span className="host-workspace-nav__label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
