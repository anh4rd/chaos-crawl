var e=`import { useId, useState } from "react";
import type { ReactNode } from "react";
import Button from "../ui/Button";
import TabList from "../ui/TabList";
import TabPanel from "../ui/TabPanel";
import SessionRankRow from "./SessionRankRow";
import SessionPodium from "./SessionPodium";
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
  viewerRole,
  scoreControls,
  teamScoresUnavailable = false,
}: {
  title?: string;
  variant?: "compact" | "page";
  entries: RankedParticipant[];
  teams?: RankedParticipant[];
  viewerId?: string | null;
  viewerTeamId?: string | null;
  controls?: (entry: RankedParticipant) => ReactNode;
  tourTarget?: string;
  teamsEnabled?: boolean;
  viewerRole?: "host" | "player";
  scoreControls?: ReactNode;
  teamScoresUnavailable?: boolean;
}) {
  const idPrefix = useId();
  const [selectedTab, setSelectedTab] = useState<"players" | "teams">(
    "players",
  );
  const showTeamsTab = teamsEnabled ?? teams.length > 0;
  const activeTab = showTeamsTab ? selectedTab : "players";
  const isPage = variant === "page";

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
  const scoreRows = showTeamsTab ? (
    <>
      <TabList
        label="Leaderboard"
        variant={isPage ? "leaderboard" : "workspace"}
      >
        <Button
          variant={isPage ? "leaderboard-tab" : "workspace-tab"}
          fullWidth={false}
          type="button"
          role="tab"
          id={\`\${idPrefix}-players-tab\`}
          aria-controls={\`\${idPrefix}-players-panel\`}
          tabIndex={activeTab === "players" ? 0 : -1}
          aria-selected={activeTab === "players"}
          className={
            !isPage && activeTab === "players" ? "btn--workspace-selected" : ""
          }
          onClick={() => setSelectedTab("players")}
        >
          {isPage ? "Player Scores" : "Players"}
        </Button>
        <Button
          variant={isPage ? "leaderboard-tab" : "workspace-tab"}
          fullWidth={false}
          type="button"
          role="tab"
          id={\`\${idPrefix}-teams-tab\`}
          aria-controls={\`\${idPrefix}-teams-panel\`}
          tabIndex={activeTab === "teams" ? 0 : -1}
          aria-selected={activeTab === "teams"}
          className={
            !isPage && activeTab === "teams" ? "btn--workspace-selected" : ""
          }
          onClick={() => setSelectedTab("teams")}
        >
          {isPage ? "Team Scores" : "Teams"}
        </Button>
      </TabList>
      <TabPanel
        id={\`\${idPrefix}-players-panel\`}
        labelledBy={\`\${idPrefix}-players-tab\`}
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
                variant={isPage ? "page" : undefined}
                firstPlaceTrophy={viewerRole === "player"}
                hostRanking={viewerRole === "host"}
              />
            ))}
          </>
        ) : null}
      </TabPanel>
      <TabPanel
        id={\`\${idPrefix}-teams-panel\`}
        labelledBy={\`\${idPrefix}-teams-tab\`}
        active={activeTab === "teams"}
      >
        {activeTab === "teams" ? (
          <>
            {teamScoresUnavailable ? (
              <p>Team scores are unavailable. Please try again.</p>
            ) : (
              teams.length === 0 && (
                <p>No teams yet. Team scores appear when teams join.</p>
              )
            )}
            {!teamScoresUnavailable &&
              teams.map((entry, index) => (
                <SessionRankRow
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                  selected={entry.id === viewerTeamId}
                  variant={isPage ? "page" : undefined}
                  firstPlaceTrophy={viewerRole === "player"}
                  hostRanking={viewerRole === "host"}
                />
              ))}
            <p>Team scores include member points and host adjustments.</p>
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
          variant={isPage ? "page" : undefined}
          firstPlaceTrophy={viewerRole === "player"}
          hostRanking={viewerRole === "host"}
        />
      ))}
    </>
  );
  return (
    <section
      className={\`session-leaderboard\${isPage ? " session-leaderboard--page" : ""}\`}
      data-tour={tourTarget}
    >
      <header
        className={
          isPage ? "u-visually-hidden" : "session-leaderboard__heading"
        }
      >
        <h2>{title}</h2>
        <span>
          {activeTab === "teams" ? teams.length : entries.length} {activeTab}
        </span>
      </header>
      {isPage && !(activeTab === "teams" && teamScoresUnavailable) && (
        <SessionPodium
          entries={activeTab === "teams" ? teams : entries}
          label={activeTab === "teams" ? "Top teams" : "Top players"}
        />
      )}
      {isPage && scoreControls}
      {isPage ? (
        <div className="session-leaderboard__board">{scoreRows}</div>
      ) : (
        scoreRows
      )}
    </section>
  );
}
`;export{e as default};