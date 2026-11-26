var e=`import PanelGrid from "../../components/ui/PanelGrid";
import DisplayHeading from "../../components/ui/DisplayHeading";
import PageFrame from "../../components/ui/PageFrame";
import type { ReactNode } from "react";
import AdminNavigation from "./AdminNavigation";
import type { AdminTab } from "./adminTabs";
export default function LegacyAdminView({
  activeTab,
  onTab,
  children,
  as = "main",
}: {
  activeTab: AdminTab;
  onTab: (tab: AdminTab) => void;
  children: ReactNode;
  as?: "main" | "section";
}) {
  return (
    <PageFrame as={as} variant="content">
      <DisplayHeading as="h1" variant="plain-title">
        Host Control
      </DisplayHeading>
      <AdminNavigation activeTab={activeTab} onTab={onTab} />
      <PanelGrid variant="feed-page">{children}</PanelGrid>
    </PageFrame>
  );
}
`;export{e as default};