var e=`import PageFrame from "../../components/ui/PageFrame";
import type { ReactNode } from "react";
import HostGameHeader from "./HostGameHeader";
import HostGameNavigation from "./HostGameNavigation";
import type { HostTab } from "./types";
export default function HostGameFrame({
  contained = false,
  currentAvailable,
  playerCount,
  activeTab,
  onTabChange,
  children,
}: {
  contained?: boolean;
  currentAvailable: boolean;
  playerCount: number;
  activeTab: HostTab;
  onTabChange: (tab: HostTab) => void;
  children: ReactNode;
}) {
  return (
    <PageFrame
      as={contained ? "div" : "main"}
      variant="bare"
      className={\`legacy-host\${contained ? " legacy-host--preview" : ""}\`}
    >
      <div className="legacy-host__app">
        <HostGameHeader
          currentAvailable={currentAvailable}
          playerCount={playerCount}
        />
        <div className="legacy-host__content">{children}</div>
        <HostGameNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </PageFrame>
  );
}
`;export{e as default};