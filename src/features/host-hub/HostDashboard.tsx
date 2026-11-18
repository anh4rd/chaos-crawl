import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import StatTile from "../../components/ui/StatTile";
import { useNavigate } from "react-router-dom";
import HostWorkspace from "../host-workspace/HostWorkspace";
import GameContext from "./GameContext";
import HostDirectory from "./HostDirectory";
import { GameCard } from "./GameCard";
import { useHostHub } from "./useHostHub";
import "../../styles/HostPortal.css";
import "../../styles/HostPlanning.css";
import "../../styles/HostTheme.css";
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
          <div className="host-preview-banner">
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
          </div>
        )}
        {created && (
          <div className="host-alert host-alert--success">
            Game plan saved. You can edit it any time before the event.
          </div>
        )}
        {error && <div className="host-alert host-alert--error">{error}</div>}

        <div className="host-tabs" role="tablist" aria-label="Game list view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "home"}
            className={view === "home" ? "is-active" : ""}
            onClick={() =>
              navigate(
                viewAsHostId
                  ? `/host?viewAs=${encodeURIComponent(viewAsHostId)}`
                  : "/host",
              )
            }
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "games"}
            className={view === "games" ? "is-active" : ""}
            onClick={() =>
              navigate(
                viewAsHostId
                  ? `/host/games?viewAs=${encodeURIComponent(viewAsHostId)}`
                  : "/host/games",
              )
            }
          >
            Your games <span className="host-tab-count">{games.length}</span>
          </button>
        </div>

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

        <section className="host-list-section">
          <div className="host-section-heading">
            <div>
              <h2>{view === "home" ? "Upcoming games" : "All plans"}</h2>
              <p>
                {view === "home"
                  ? "Pick up where you left off."
                  : "Edit drafts or review plans you've saved."}
              </p>
            </div>
            {view === "home" && (
              <button
                type="button"
                className="host-text-button"
                onClick={() => navigate("/host/games")}
              >
                View all →
              </button>
            )}
          </div>
          {loading ? (
            <div className="host-empty-state">Loading your games…</div>
          ) : view === "games" ? (
            games.length ? (
              <div className="host-game-grid">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onEdit={editGame}
                    onPlay={playGame}
                    playing={playingId === game.id}
                    readOnly={Boolean(viewAsHostId)}
                  />
                ))}
              </div>
            ) : (
              <div className="host-empty-state">
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
              </div>
            )
          ) : upcoming.length ? (
            <div className="host-game-grid">
              {upcoming.slice(0, 3).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={editGame}
                  onPlay={playGame}
                  playing={playingId === game.id}
                  readOnly={Boolean(viewAsHostId)}
                />
              ))}
            </div>
          ) : (
            <div className="host-empty-state">
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
            </div>
          )}
        </section>

        {view === "home" && past.length > 0 && (
          <section className="host-list-section">
            <div className="host-section-heading">
              <div>
                <h2>Past games</h2>
                <p>Previous plans and results.</p>
              </div>
            </div>
            <div className="host-game-grid">
              {past.slice(0, 3).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onEdit={editGame}
                  onPlay={playGame}
                  playing={playingId === game.id}
                  readOnly={Boolean(viewAsHostId)}
                />
              ))}
            </div>
          </section>
        )}

        {isPlatformAdmin && !viewAsHostId && (
          <HostDirectory
            hosts={hostDirectory}
            onPreview={(hostId) =>
              navigate(`/host?viewAs=${encodeURIComponent(hostId)}`)
            }
          />
        )}
      </div>
    </HostWorkspace>
  );
}
