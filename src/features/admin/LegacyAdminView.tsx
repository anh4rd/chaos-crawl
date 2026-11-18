import type { ReactNode } from "react";
import AdminNavigation from "./AdminNavigation";
import type { AdminTab } from "./adminTabs";
export default function LegacyAdminView({
  activeTab,
  onTab,
  children,
}: {
  activeTab: AdminTab;
  onTab: (tab: AdminTab) => void;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      <h1 className="text-4xl font-bold">Host Control</h1>
      <AdminNavigation activeTab={activeTab} onTab={onTab} />
      <div className="mt-6 space-y-6">{children}</div>
    </main>
  );
}
