var e=`import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import { ADMIN_TABS, type AdminTab } from "./adminTabs";
export default function AdminNavigation({
  activeTab,
  onTab,
}: {
  activeTab: AdminTab;
  onTab: (tab: AdminTab) => void;
}) {
  return (
    <div className="admin-navigation">
      <ControlRow aria-label="Host controls" variant="tabs">
        {ADMIN_TABS.map(([tab, label]) => (
          <Button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => onTab(tab)}
            variant="navigation-tab"
            fullWidth={false}
          >
            {label}
          </Button>
        ))}
      </ControlRow>
    </div>
  );
}
`;export{e as default};