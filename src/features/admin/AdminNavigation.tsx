import { ADMIN_TABS, type AdminTab } from "./adminTabs";
export default function AdminNavigation({
  activeTab,
  onTab,
}: {
  activeTab: AdminTab;
  onTab: (tab: AdminTab) => void;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 mt-6 overflow-x-auto border-y border-zinc-800 bg-black/95 px-6 py-3 backdrop-blur">
      <div className="flex gap-2" aria-label="Host controls">
        {ADMIN_TABS.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => onTab(tab)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-pink-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
