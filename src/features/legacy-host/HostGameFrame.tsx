import type { ReactNode } from "react";
import HostGameHeader from "./HostGameHeader";
import HostGameNavigation from "./HostGameNavigation";
import type { HostTab } from "./types";
export default function HostGameFrame({
  currentAvailable,
  playerCount,
  activeTab,
  onTabChange,
  children,
}: {
  currentAvailable: boolean;
  playerCount: number;
  activeTab: HostTab;
  onTabChange: (tab: HostTab) => void;
  children: ReactNode;
}) {
  return (
    <main className="host-v2">
      <div className="host-v2__app">
        <HostGameHeader
          currentAvailable={currentAvailable}
          playerCount={playerCount}
        />
        <div className="host-v2__content">{children}</div>
        <HostGameNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </main>
  );
}
