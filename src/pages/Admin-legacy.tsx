import { useState } from "react";
import GameControlTabs from "../features/admin/game/GameControlTabs";
import ParticipationTab from "../features/admin/participation/ParticipationTab";
import CompletionReviewTab from "../features/admin/participation/CompletionReviewTab";
import VotingTab from "../features/admin/voting/VotingTab";
import PlayersTab from "../features/admin/players/PlayersTab";
import TeamsTab from "../features/admin/teams/TeamsTab";

const tabs = [
  ["live", "🔴 Live"],
  ["tonight", "🌙 Tonight"],
  ["challenges", "🎯 Challenges"],
  ["review", "✅ Review"],
  ["screens", "📺 Screens"],
  ["voting", "🗳️ Voting"],
  ["players", "👥 Players"],
  ["teams", "🏁 Teams"],
] as const;
type AdminTab = (typeof tabs)[number][0];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("live");
  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      <h1 className="text-4xl font-bold">Host Control</h1>
      <div className="sticky top-0 z-30 -mx-6 mt-6 overflow-x-auto border-y border-zinc-800 bg-black/95 px-6 py-3 backdrop-blur">
        <div className="flex gap-2" aria-label="Host controls">
          {tabs.map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-pink-500 text-white" : "bg-zinc-900 text-zinc-400"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-6">
        {(activeTab === "live" ||
          activeTab === "tonight" ||
          activeTab === "screens") && <GameControlTabs activeTab={activeTab} />}
        {activeTab === "challenges" && <ParticipationTab />}
        {activeTab === "review" && <CompletionReviewTab />}
        {activeTab === "voting" && <VotingTab />}
        {activeTab === "players" && <PlayersTab />}
        {activeTab === "teams" && <TeamsTab />}
      </div>
    </main>
  );
}
