import { useId, useState } from "react";
import type { ReactNode } from "react";
import Button from "../ui/Button";
import TabList from "../ui/TabList";
import TabPanel from "../ui/TabPanel";
import SessionRankRow from "./SessionRankRow";
import type { RankedParticipant } from "./types";

export default function SessionLeaderboard({
  title = "Leaderboard",
  variant,
  entries,
  teams = [],
  viewerId,
  viewerTeamId,
  controls,
  tourTarget,
  teamsEnabled,
}: {
  title?: string;
  variant?: "compact";
  entries: RankedParticipant[];
  teams?: RankedParticipant[];
  viewerId?: string | null;
  viewerTeamId?: string | null;
  controls?: (entry: RankedParticipant) => ReactNode;
  tourTarget?: string;
  teamsEnabled?: boolean;
}) {
  const idPrefix = useId();
  const [selectedTab, setSelectedTab] = useState<"players" | "teams">(
    "players",
  );
  const showTeamsTab = teamsEnabled ?? teams.length > 0;
  const activeTab = showTeamsTab ? selectedTab : "players";

  if (variant === "compact")
    return (
      <div className="session-leaderboard session-leaderboard--compact">
        {entries.map((entry, index) => (
          <SessionRankRow
            key={entry.id}
            entry={entry}
            rank={index + 1}
            variant="compact"
          />
        ))}
      </div>
    );
  return (
    <section className="session-leaderboard" data-tour={tourTarget}>
      <header className="session-leaderboard__heading">
        <h2>{title}</h2>
        <span>
          {activeTab === "teams" ? teams.length : entries.length} {activeTab}
        </span>
      </header>
      {showTeamsTab ? (
        <>
          <TabList label="Leaderboard" variant="workspace">
            <Button
              variant="workspace-tab"
              fullWidth={false}
              type="button"
              role="tab"
              id={`${idPrefix}-players-tab`}
              aria-controls={`${idPrefix}-players-panel`}
              tabIndex={activeTab === "players" ? 0 : -1}
              aria-selected={activeTab === "players"}
              className={
                activeTab === "players" ? "btn--workspace-selected" : ""
              }
              onClick={() => setSelectedTab("players")}
            >
              Players
            </Button>
            <Button
              variant="workspace-tab"
              fullWidth={false}
              type="button"
              role="tab"
              id={`${idPrefix}-teams-tab`}
              aria-controls={`${idPrefix}-teams-panel`}
              tabIndex={activeTab === "teams" ? 0 : -1}
              aria-selected={activeTab === "teams"}
              className={activeTab === "teams" ? "btn--workspace-selected" : ""}
              onClick={() => setSelectedTab("teams")}
            >
              Teams
            </Button>
          </TabList>
          <TabPanel
            id={`${idPrefix}-players-panel`}
            labelledBy={`${idPrefix}-players-tab`}
            active={activeTab === "players"}
          >
            {activeTab === "players" ? (
              <>
                {entries.length === 0 && (
                  <p>No players yet. Scores appear when players join.</p>
                )}
                {entries.map((entry, index) => (
                  <SessionRankRow
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    selected={entry.id === viewerId}
                    action={controls?.(entry)}
                  />
                ))}
              </>
            ) : null}
          </TabPanel>
          <TabPanel
            id={`${idPrefix}-teams-panel`}
            labelledBy={`${idPrefix}-teams-tab`}
            active={activeTab === "teams"}
          >
            {activeTab === "teams" ? (
              <>
                {teams.length === 0 && (
                  <p>No teams yet. Team scores appear when teams join.</p>
                )}
                {teams.map((entry, index) => (
                  <SessionRankRow
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    selected={entry.id === viewerTeamId}
                  />
                ))}
                <p>Team scores are the combined points earned by members.</p>
              </>
            ) : null}
          </TabPanel>
        </>
      ) : (
        <>
          {entries.length === 0 && (
            <p>No players yet. Scores appear when players join.</p>
          )}
          {entries.map((entry, index) => (
            <SessionRankRow
              key={entry.id}
              entry={entry}
              rank={index + 1}
              selected={entry.id === viewerId}
              action={controls?.(entry)}
            />
          ))}
        </>
      )}
    </section>
  );
}
