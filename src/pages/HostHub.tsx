import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  LoaderCircle,
  MapPin,
  Play,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "../lib/sessionSupabase";
import { challengeIcon } from "../lib/challengeVisuals";
import HostShell from "../components/host/HostShell";
import { createOrGetHostGameSession } from "../lib/gameSessions";
import "../styles/HostPortal.css";
import "../styles/HostPlanning.css";
import "../styles/HostHub.css";
import "../styles/HostTheme.css";

interface HostDirectoryEntry {
  host_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  game_count: number;
}

interface HostPreviewIdentity {
  id: string;
  email: string | null;
  display_name: string | null;
}

interface HostGame {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  player_count: number;
  venue_name: string | null;
  status: "draft" | "planned" | "live" | "completed";
  plan_data?: {
    gamePhotoUrl?: string | null;
    selectedTasks?: Array<{
      id?: string;
      title: string;
      description?: string;
      kind?: string;
    }>;
  } | null;
}

const HOST_GAME_SUMMARY_FIELDS =
  "id,name,event_date,start_time,end_time,player_count,venue_name,status,plan_data";

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value: string | null) {
  if (!value) return "Date to be confirmed";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeLabel(value: string | null) {
  if (!value) return "Time TBC";
  return value.slice(0, 5);
}

function GameCard({
  game,
  onEdit,
  onPlay,
  playing,
  readOnly = false,
}: {
  game: HostGame;
  onEdit: (id: string) => void;
  onPlay: (game: HostGame) => void;
  playing: boolean;
  readOnly?: boolean;
}) {
  const completed =
    game.status === "completed" ||
    (game.event_date
      ? new Date(`${game.event_date}T23:59:59`).getTime() < Date.now()
      : false);
  const canPlay = game.status === "planned" || game.status === "live";
  const challengeTasks = (game.plan_data?.selectedTasks ?? []).filter(
    (task) => !task.kind || task.kind === "main",
  );

  return (
    <article className="host-game-card">
      <div className="host-game-card-art">
        {game.plan_data?.gamePhotoUrl ? (
          <img src={game.plan_data.gamePhotoUrl} alt={`${game.name} cover`} />
        ) : (
          <>
            <Sparkles size={27} />
            <span>{game.name.slice(0, 1).toUpperCase() || "C"}</span>
          </>
        )}
      </div>
      <div className="host-game-card-content">
        <div className="host-card-topline">
          <span className={`host-status host-status--${game.status}`}>
            {game.status === "planned"
              ? "Planned"
              : game.status === "draft"
                ? "Draft"
                : game.status === "live"
                  ? "Live"
                  : "Completed"}
          </span>
          <span className="host-muted host-small">
            {completed ? "Past game" : readOnly ? "Host game" : "Your game"}
          </span>
        </div>
        <h3>{game.name}</h3>
        {challengeTasks.length > 0 && (
          <div
            className="host-game-challenge-icons"
            aria-label="Challenges in this game"
          >
            {challengeTasks.slice(0, 4).map((task, index) => (
              <span
                key={task.id ?? `${task.title}-${index}`}
                title={task.title}
              >
                {challengeIcon(task.title, task.description)}
              </span>
            ))}
          </div>
        )}
        <div className="host-game-meta">
          <span>
            <CalendarDays size={15} />
            {dateLabel(game.event_date)}
          </span>
          <span>
            <Clock3 size={15} />
            {timeLabel(game.start_time)}
            {game.end_time ? `–${timeLabel(game.end_time)}` : ""}
          </span>
        </div>
        <div className="host-game-meta">
          <span>
            <MapPin size={15} />
            {game.venue_name || "Venue not set"}
          </span>
          <span>
            <Users size={15} />
            About {game.player_count} players
          </span>
        </div>
        <div className="host-game-actions">
          <button
            type="button"
            className="host-button host-button--secondary"
            onClick={() => onEdit(game.id)}
            disabled={readOnly}
          >
            <Edit3 size={15} />{" "}
            {completed
              ? "View plan"
              : game.status === "draft"
                ? "Continue setup"
                : "Edit plan"}
          </button>
          {canPlay && (
            <button
              type="button"
              className="host-button host-button--lime"
              onClick={() => onPlay(game)}
              disabled={playing || readOnly}
            >
              {playing ? (
                <LoaderCircle size={15} className="host-button-spinner" />
              ) : (
                <Play size={15} />
              )}
              {playing
                ? "Starting…"
                : game.status === "live"
                  ? "Resume live game"
                  : "Play game"}
            </button>
          )}
          {readOnly && (
            <span className="host-preview-readonly-label">Read-only</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HostHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const viewAsHostId = searchParams.get("viewAs");
  const [games, setGames] = useState<HostGame[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [hostDirectory, setHostDirectory] = useState<HostDirectoryEntry[]>([]);
  const [viewingHost, setViewingHost] = useState<HostPreviewIdentity | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const view: "home" | "games" =
    location.pathname === "/host/games" ? "games" : "home";

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setLoading(false);
      setError("Your session has expired. Please log in again.");
      return;
    }

    const dateKey = localDateKey();
    const gamesRequest =
      view === "games"
        ? supabase
            .from("host_games")
            .select(HOST_GAME_SUMMARY_FIELDS)
            .eq("host_id", userData.user.id)
            .order("created_at", { ascending: false })
        : Promise.all([
            supabase
              .from("host_games")
              .select(HOST_GAME_SUMMARY_FIELDS)
              .eq("host_id", userData.user.id)
              .neq("status", "completed")
              .or(`event_date.is.null,event_date.gte.${dateKey}`)
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("host_games")
              .select(HOST_GAME_SUMMARY_FIELDS)
              .eq("host_id", userData.user.id)
              .or(`status.eq.completed,event_date.lt.${dateKey}`)
              .order("created_at", { ascending: false })
              .limit(3),
          ]).then(([upcomingResult, pastResult]) => ({
            data: [...(upcomingResult.data ?? []), ...(pastResult.data ?? [])],
            error: upcomingResult.error ?? pastResult.error,
          }));
    const [{ data: adminData, error: adminError }, gamesResult] =
      await Promise.all([supabase.rpc("cc_is_platform_admin"), gamesRequest]);
    const platformAdmin = !adminError && Boolean(adminData);
    setIsPlatformAdmin(platformAdmin);

    if (viewAsHostId) {
      if (!platformAdmin) {
        setLoading(false);
        setError(
          "Only a platform administrator can view another host's Host Hub.",
        );
        setViewingHost(null);
        setGames([]);
        return;
      }
      const { data: previewData, error: previewError } = await supabase.rpc(
        "cc_super_admin_host_hub",
        { p_host_id: viewAsHostId },
      );
      setLoading(false);
      if (previewError || !previewData) {
        console.error("HOST PREVIEW ERROR", previewError);
        setError(
          previewError?.message ??
            "Couldn't load this host's dashboard. Check the platform-admin migration.",
        );
        return;
      }
      const payload = previewData as {
        host: HostPreviewIdentity;
        games: HostGame[];
      };
      setViewingHost(payload.host ?? null);
      setGames(Array.isArray(payload.games) ? payload.games : []);
      return;
    }

    setViewingHost(null);
    const { data, error: queryError } = gamesResult;
    if (queryError) {
      setLoading(false);
      console.error("LOAD HOST GAMES ERROR", queryError);
      setError(
        "Couldn't load your plans. Make sure the host planning database migration has been run.",
      );
      return;
    }
    setGames((data ?? []) as HostGame[]);
    setLoading(false);
    if (platformAdmin && view === "home") {
      setHostDirectory([]);
      const { data: hosts, error: hostsError } = await supabase.rpc(
        "cc_super_admin_list_hosts",
      );
      if (hostsError) {
        console.warn("Could not load host directory", hostsError);
      } else {
        setHostDirectory((hosts ?? []) as HostDirectoryEntry[]);
      }
    }
  }, [viewAsHostId, view]);
  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const upcoming = games.filter(
    (game) =>
      game.status !== "completed" &&
      (!game.event_date ||
        new Date(`${game.event_date}T23:59:59`).getTime() >= Date.now()),
  );
  const past = games.filter(
    (game) =>
      game.status === "completed" ||
      (game.event_date &&
        new Date(`${game.event_date}T23:59:59`).getTime() < Date.now()),
  );
  const editGame = (id: string) => navigate(`/host/games/${id}/edit`);
  const dashboardGame =
    upcoming.find((game) => game.status === "live") ??
    upcoming.find((game) => game.status === "planned") ??
    upcoming[0] ??
    games[0] ??
    null;
  const setupChecks = dashboardGame
    ? [
        {
          label: "Game details",
          done: Boolean(dashboardGame.name && dashboardGame.event_date),
        },
        { label: "Players & teams", done: dashboardGame.player_count >= 2 },
        { label: "Venue", done: Boolean(dashboardGame.venue_name) },
        {
          label: "Ready to play",
          done:
            dashboardGame.status === "planned" ||
            dashboardGame.status === "live",
        },
      ]
    : [];
  const setupDone = setupChecks.filter((item) => item.done).length;
  const contextPanel = (
    <div className="host-game-context">
      <section className="host-context-card host-context-overview">
        <div className="host-context-ribbon">GAME OVERVIEW</div>
        {dashboardGame ? (
          <>
            <div className="host-context-art">
              <Sparkles size={30} />
              <span>{dashboardGame.name.slice(0, 1).toUpperCase()}</span>
            </div>
            <div className="host-context-game-copy">
              <h3>{dashboardGame.name}</h3>
              <ul>
                <li>
                  <CalendarDays size={15} />
                  {dateLabel(dashboardGame.event_date)}
                </li>
                <li>
                  <Users size={15} />
                  {dashboardGame.player_count} players (target)
                </li>
                <li>
                  <MapPin size={15} />
                  {dashboardGame.venue_name || "Venue not set"}
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="host-context-edit"
              aria-label="Edit game overview"
              onClick={() => editGame(dashboardGame.id)}
              disabled={Boolean(viewAsHostId)}
            >
              <Edit3 size={17} />
            </button>
          </>
        ) : (
          <div className="host-context-empty">
            <h3>No game selected</h3>
            <p>Create a plan and your overview will appear here.</p>
          </div>
        )}
      </section>
      <section className="host-context-card host-context-progress">
        <div className="host-context-ribbon">SETUP PROGRESS</div>
        {dashboardGame ? (
          <>
            <strong className="host-context-progress-count">
              {setupDone} of {setupChecks.length} details set
            </strong>
            <div className="host-context-progress-track">
              <span
                style={{ width: `${(setupDone / setupChecks.length) * 100}%` }}
              />
            </div>
            <ul>
              {setupChecks.map((item) => (
                <li key={item.label} className={item.done ? "is-complete" : ""}>
                  <span className="host-context-check">
                    {item.done ? <Check size={14} /> : "○"}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="host-context-continue"
              onClick={() =>
                dashboardGame.status === "planned" ||
                dashboardGame.status === "live"
                  ? void playGame(dashboardGame)
                  : editGame(dashboardGame.id)
              }
              disabled={Boolean(viewAsHostId)}
            >
              {dashboardGame.status === "live"
                ? "Resume live game"
                : dashboardGame.status === "planned"
                  ? "Play this game"
                  : "Continue setup"}{" "}
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="host-context-continue"
            onClick={() => navigate("/host/games/new")}
            disabled={Boolean(viewAsHostId)}
          >
            Plan your first game <ArrowRight size={16} />
          </button>
        )}
      </section>
      <div className="host-context-tip">
        <Sparkles size={17} />
        <span>
          <strong>Make it yours.</strong> Edit a plan any time before the game
          starts.
        </span>
      </div>
    </div>
  );

  async function playGame(game: HostGame) {
    if (viewAsHostId) return;
    if (game.status !== "planned" && game.status !== "live") {
      navigate(`/host/games/${game.id}/edit`);
      return;
    }

    setPlayingId(game.id);
    setError("");
    try {
      const session = await createOrGetHostGameSession(game.id);
      navigate(`/host/live/${session.id}`);
    } catch (launchError) {
      console.error("CREATE HOST GAME SESSION ERROR", launchError);
      setError(
        launchError instanceof Error
          ? launchError.message
          : "Couldn't prepare this game. Check that the multi-game migration has been applied.",
      );
    } finally {
      setPlayingId(null);
    }
  }

  return (
    <HostShell
      title={
        viewAsHostId
          ? view === "home"
            ? "Your Host Hub"
            : "Your games"
          : view === "home"
            ? "Your Host Hub"
            : "Your games"
      }
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
      contextPanel={contextPanel}
    >
      <div className="host-hub-dashboard">
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
            <button
              type="button"
              className="host-button host-button--secondary"
              onClick={() => navigate("/host", { replace: true })}
            >
              Return to your Host Hub
            </button>
          </div>
        )}
        {searchParams.get("created") === "1" && (
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

        <section className="host-hub-summary" aria-label="Host Hub summary">
          <article>
            <span className="host-hub-summary-icon">
              <CalendarDays size={22} />
            </span>
            <div>
              <strong>{upcoming.length}</strong>
              <small>Upcoming games</small>
            </div>
          </article>
          <article>
            <span className="host-hub-summary-icon">
              <Users size={22} />
            </span>
            <div>
              <strong>
                {upcoming.reduce((total, game) => total + game.player_count, 0)}
              </strong>
              <small>Players planned</small>
            </div>
          </article>
          <article>
            <span className="host-hub-summary-icon">
              <Sparkles size={22} />
            </span>
            <div>
              <strong>{games.length}</strong>
              <small>Saved plans</small>
            </div>
          </article>
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
                <Sparkles size={25} />
                <h3>No games yet</h3>
                <p>Your saved game plans will appear here.</p>
                {!viewAsHostId && (
                  <button
                    className="host-button host-button--primary"
                    onClick={() => navigate("/host/games/new")}
                    type="button"
                  >
                    <Plus size={17} /> Create your first game
                  </button>
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
              <Sparkles size={25} />
              <h3>It's quiet… suspiciously quiet.</h3>
              <p>
                Start with a few details. You can sort out the challenges next.
              </p>
              {!viewAsHostId && (
                <button
                  className="host-button host-button--primary"
                  onClick={() => navigate("/host/games/new")}
                  type="button"
                >
                  <Plus size={17} /> Create your first game
                </button>
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
          <section className="host-list-section host-platform-admin-section">
            <div className="host-section-heading">
              <div>
                <span className="host-admin-kicker">PLATFORM ADMIN</span>
                <h2>Host accounts</h2>
                <p>
                  Open a read-only Host Hub dashboard view to see the games
                  another host sees.
                </p>
              </div>
              <span className="host-tab-count">
                {hostDirectory.length} hosts
              </span>
            </div>
            {hostDirectory.length ? (
              <div className="host-admin-host-list">
                {hostDirectory.map((host) => (
                  <article className="host-admin-host-row" key={host.host_id}>
                    <div className="host-admin-avatar">
                      {(host.display_name || host.email || "H")
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div className="host-admin-host-copy">
                      <strong>
                        {host.display_name || host.email || "Host account"}
                      </strong>
                      <span>{host.email || "No email"}</span>
                      <small>
                        {host.game_count}{" "}
                        {host.game_count === 1 ? "game" : "games"} · joined{" "}
                        {new Date(host.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="host-button host-button--secondary"
                      onClick={() =>
                        navigate(
                          `/host?viewAs=${encodeURIComponent(host.host_id)}`,
                        )
                      }
                    >
                      View Host Hub
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="host-empty-state">No host accounts found.</div>
            )}
          </section>
        )}
      </div>
    </HostShell>
  );
}
