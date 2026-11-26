var e=`import { useId, useState } from "react";
import PanelGrid from "../../components/ui/PanelGrid";
import EmptyState from "../../components/ui/EmptyState";
import PanelHeading from "../../components/ui/PanelHeading";
import CountBadge from "../../components/ui/CountBadge";
import TabList from "../../components/ui/TabList";
import FeedbackNotice from "../../components/ui/FeedbackNotice";
import ContentPanel from "../../components/ui/ContentPanel";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import StatTile from "../../components/ui/StatTile";
import { useNavigate } from "react-router-dom";
import HostWorkspace from "../host-workspace/HostWorkspace";
import GameContext from "./GameContext";
import HostDirectory from "./HostDirectory";
import { GameCard } from "./GameCard";
import GameCohostManager from "./GameCohostManager";
import { useHostHub } from "./useHostHub";
import type { HostGame } from "../../types/hostHub";
export default function HostDashboard({
  view,
  viewAsHostId,
  created,
}: {
  view: "home" | "games";
  viewAsHostId: string | null;
  created: boolean;
}) {
  const navigate = useNavigate();
  const tabId = useId();
  const overviewId = \`\${tabId}-overview\`;
  const gamesId = \`\${tabId}-games\`;
  const panelId = \`\${tabId}-plans\`;
  const [cohostGame, setCohostGame] = useState<HostGame | null>(null);
  const {
    games,
    upcoming,
    past,
    dashboardGame,
    isPlatformAdmin,
    hostDirectory,
    viewingHost,
    loading,
    error,
    playingId,
    userId,
    editGame,
    playGame,
  } = useHostHub({ view, viewAsHostId, navigate });
  return (
    <HostWorkspace
      title={view === "home" ? "Your Host Hub" : "Your games"}
      subtitle={
        viewAsHostId
          ? "Read-only view of this host's dashboard."
          : view === "home"
            ? "Your next great idea starts here."
            : "All your game plans, in one place."
      }
      showCreate={!viewAsHostId}
      previewUser={
        viewingHost
          ? {
              id: viewingHost.id,
              displayName:
                viewingHost.display_name || viewingHost.email || "Host",
              email: viewingHost.email || "",
            }
          : undefined
      }
      readOnlyPreview={Boolean(viewAsHostId)}
      contextPanel={
        <GameContext
          dashboardGame={dashboardGame}
          readOnly={Boolean(viewAsHostId)}
          onEdit={editGame}
          onPlay={playGame}
          onCreate={() => navigate("/host/games/new")}
        />
      }
    >
      <div className="host-dashboard">
        {viewAsHostId && (
          <ContentPanel variant="workspace-preview" as="div">
            <div>
              <strong>
                Viewing as{" "}
                {viewingHost?.display_name || viewingHost?.email || "host"}
              </strong>
              <span>
                {viewingHost?.email} · Read-only preview. No host data can be
                changed from this view.
              </span>
            </div>
            <Button
              type="button"
              variant="comic-secondary"
              fullWidth={false}
              onClick={() => navigate("/host", { replace: true })}
            >
              Return to your Host Hub
            </Button>
          </ContentPanel>
        )}
        {created && (
          <FeedbackNotice tone="success">
            Game plan saved. You can edit it any time before the event.
          </FeedbackNotice>
        )}
        {error && <FeedbackNotice tone="error">{error}</FeedbackNotice>}

        <TabList label="Game list view" variant="workspace">
          <Button
            variant="workspace-tab"
            fullWidth={false}
            type="button"
            role="tab"
            id={overviewId}
            aria-controls={panelId}
            tabIndex={view === "home" ? 0 : -1}
            aria-selected={view === "home"}
            className={view === "home" ? "btn--workspace-selected" : ""}
            onClick={() =>
              navigate(
                viewAsHostId
                  ? \`/host?viewAs=\${encodeURIComponent(viewAsHostId)}\`
                  : "/host",
              )
            }
          >
            Overview
          </Button>
          <Button
            variant="workspace-tab"
            fullWidth={false}
            type="button"
            role="tab"
            id={gamesId}
            aria-controls={panelId}
            tabIndex={view === "games" ? 0 : -1}
            aria-selected={view === "games"}
            className={view === "games" ? "btn--workspace-selected" : ""}
            onClick={() =>
              navigate(
                viewAsHostId
                  ? \`/host/games?viewAs=\${encodeURIComponent(viewAsHostId)}\`
                  : "/host/games",
              )
            }
          >
            {"Your games "}
            <CountBadge variant="workspace">{games.length}</CountBadge>
          </Button>
        </TabList>

        <section className="stat-grid" aria-label="Host Hub summary">
          <StatTile
            icon="calendar-days"
            value={upcoming.length}
            label="Upcoming games"
          />
          <StatTile
            icon="users"
            tone="violet"
            value={upcoming.reduce(
              (total, game) => total + game.player_count,
              0,
            )}
            label="Players planned"
          />
          <StatTile
            icon="sparkles"
            tone="pink"
            value={games.length}
            label="Saved plans"
          />
        </section>

        <section
          className="host-dashboard__section"
          id={panelId}
          role="tabpanel"
          aria-labelledby={view === "home" ? overviewId : gamesId}
          tabIndex={0}
        >
          <PanelHeading variant="workspace">
            <div>
              <h2>{view === "home" ? "Upcoming games" : "All plans"}</h2>
              <p>
                {view === "home"
                  ? "Pick up where you left off."
                  : "Edit drafts or review plans you've saved."}
              </p>
            </div>
            {view === "home" && (
              <Button
                type="button"
                variant="workspace-link"
                fullWidth={false}
                onClick={() => navigate("/host/games")}
              >
                View all →
              </Button>
            )}
          </PanelHeading>
          {loading ? (
            <EmptyState variant="workspace-panel">
              Loading your games…
            </EmptyState>
          ) : view === "games" ? (
            games.length ? (
              <PanelGrid variant="games">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onEdit={editGame}
                    onPlay={playGame}
                    playing={playingId === game.id}
                    readOnly={Boolean(viewAsHostId)}
                    shared={Boolean(
                      userId && game.host_id && game.host_id !== userId,
                    )}
                    onManageCohosts={
                      !viewAsHostId && game.host_id === userId
                        ? setCohostGame
                        : undefined
                    }
                  />
                ))}
              </PanelGrid>
            ) : (
              <EmptyState variant="workspace-panel">
                <Icon name="sparkles" className="icon--size-25" />
                <h3>No games yet</h3>
                <p>Your saved game plans will appear here.</p>
                {!viewAsHostId && (
                  <Button
                    variant="comic-primary"
                    fullWidth={false}
                    onClick={() => navigate("/host/games/new")}
                    type="button"
                  >
                    <Icon name="plus" className="icon--size-17" /> Create your
                    first game
                  </Button>
                )}
              </EmptyState>
            )
          ) : upcoming.length ? (
            <PanelGrid variant="games">
              {upcoming.slice(0, 3).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={editGame}
                  onPlay={playGame}
                  playing={playingId === game.id}
                  readOnly={Boolean(viewAsHostId)}
                  shared={Boolean(
                    userId && game.host_id && game.host_id !== userId,
                  )}
                  onManageCohosts={
                    !viewAsHostId && game.host_id === userId
                      ? setCohostGame
                      : undefined
                  }
                />
              ))}
            </PanelGrid>
          ) : (
            <EmptyState variant="workspace-panel">
              <Icon name="sparkles" className="icon--size-25" />
              <h3>It's quiet… suspiciously quiet.</h3>
              <p>
                Start with a few details. You can sort out the challenges next.
              </p>
              {!viewAsHostId && (
                <Button
                  variant="comic-primary"
                  fullWidth={false}
                  onClick={() => navigate("/host/games/new")}
                  type="button"
                >
                  <Icon name="plus" className="icon--size-17" /> Create your
                  first game
                </Button>
              )}
            </EmptyState>
          )}
        </section>

        {view === "home" && past.length > 0 && (
          <section className="host-dashboard__section">
            <PanelHeading variant="workspace">
              <div>
                <h2>Past games</h2>
                <p>Previous plans and results.</p>
              </div>
            </PanelHeading>
            <PanelGrid variant="games">
              {past.slice(0, 3).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={editGame}
                  onPlay={playGame}
                  playing={playingId === game.id}
                  readOnly={Boolean(viewAsHostId)}
                  shared={Boolean(
                    userId && game.host_id && game.host_id !== userId,
                  )}
                  onManageCohosts={
                    !viewAsHostId && game.host_id === userId
                      ? setCohostGame
                      : undefined
                  }
                />
              ))}
            </PanelGrid>
          </section>
        )}

        {isPlatformAdmin && !viewAsHostId && (
          <HostDirectory
            className="host-dashboard__section"
            hosts={hostDirectory}
            onPreview={(hostId) =>
              navigate(\`/host?viewAs=\${encodeURIComponent(hostId)}\`)
            }
          />
        )}
        {cohostGame && (
          <GameCohostManager
            key={cohostGame.id}
            game={cohostGame}
            onClose={() => setCohostGame(null)}
          />
        )}
      </div>
    </HostWorkspace>
  );
}
`;export{e as default};