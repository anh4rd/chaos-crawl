import Button from "../../components/ui/Button";
import Icon, { type IconName } from "../../components/ui/Icon";
import type { HostTab } from "./types";
const TAB_ITEMS: Array<{
  id: HostTab;
  label: string;
  icon: IconName;
}> = [
  { id: "live", label: "Live", icon: "radio" },
  { id: "challenges", label: "Challenges", icon: "list-checks" },
  { id: "scores", label: "Scores", icon: "trophy" },
  { id: "players", label: "Players", icon: "users" },
];
export default function HostGameNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: HostTab;
  onTabChange: (tab: HostTab) => void;
}) {
  return (
    <nav className="legacy-host__navigation" aria-label="Host navigation">
      {TAB_ITEMS.map(({ id, label, icon }) => (
        <Button
          fullWidth={false}
          variant="console-navigation"
          type="button"
          key={id}
          className={activeTab === id ? "btn--console-active" : ""}
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onTabChange(id)}
        >
          <Icon name={icon} className="icon--size-19" strokeWidth={2.5} />
          <span>{label}</span>
        </Button>
      ))}
    </nav>
  );
}
