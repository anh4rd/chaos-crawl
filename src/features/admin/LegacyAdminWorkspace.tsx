import { useState } from "react";
import GameControlTabs from "./game/GameControlTabs";
import ParticipationTab from "./participation/ParticipationTab";
import CompletionReviewTab from "./participation/CompletionReviewTab";
import VotingTab from "./voting/VotingTab";
import PlayersTab from "./players/PlayersTab";
import TeamsTab from "./teams/TeamsTab";

import LegacyAdminView from "./LegacyAdminView";
import type { AdminTab } from "./adminTabs";
export default function LegacyAdminWorkspace() {
  const [activeTab, setActiveTab] = useState<AdminTab>("live");
  return (
    <LegacyAdminView activeTab={activeTab} onTab={setActiveTab}>
      {(activeTab === "live" ||
        activeTab === "tonight" ||
        activeTab === "screens") && <GameControlTabs activeTab={activeTab} />}
      {activeTab === "challenges" && <ParticipationTab />}
      {activeTab === "review" && <CompletionReviewTab />}
      {activeTab === "voting" && <VotingTab />}
      {activeTab === "players" && <PlayersTab />}
      {activeTab === "teams" && <TeamsTab />}
    </LegacyAdminView>
  );
}
