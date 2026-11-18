import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import GameTable from "./GameTable";
import GameInspector from "./GameInspector";
import type { PlatformGame, PlatformGameDetail } from "../../types/superAdmin";

export default function PlatformGamesView({
  games,
  filtered,
  loading,
  error,
  denied,
  query,
  status,
  selected,
  detailLoading,
  inspectorOpen,
  inspectorFeedback,
  onRetryInspection,
  onRefresh,
  onQueryChange,
  onStatusChange,
  onInspect,
  onCloseInspector,
}: {
  games: PlatformGame[];
  filtered: PlatformGame[];
  loading: boolean;
  error: string;
  denied: boolean;
  query: string;
  status: string;
  selected: PlatformGameDetail | null;
  detailLoading: boolean;
  inspectorOpen: boolean;
  inspectorFeedback?: ReactNode;
  onRetryInspection: () => void;
  onRefresh: () => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onInspect: (id: string) => void;
  onCloseInspector: () => void;
}) {
  return (
    <>
      <div className="sa-header">
        <div>
          <span className="sa-kicker">
            <Icon name="shield-check" className="icon--size-15" /> PLATFORM
            OWNER
          </span>
          <h2>All games</h2>
          <p>View games created by every host account.</p>
        </div>
        <Button variant="comic-secondary" fullWidth={false} onClick={onRefresh}>
          <Icon name="refresh-cw" className="icon--size-16" /> Refresh
        </Button>
      </div>
      {error && <div className="host-alert host-alert--error">{error}</div>}
      {denied && (
        <div className="sa-denied">
          This account isn't provisioned as a Super Admin. Run the supplied
          migration while signed in with the designated account, then refresh.
        </div>
      )}
      <div className="sa-stats">
        <article>
          <Icon name="gamepad2" className="icon--size-24" />
          <strong>{games.length}</strong>
          <span>Total games</span>
        </article>
        <article>
          <Icon name="users" className="icon--size-24" />
          <strong>
            {games.reduce((n, g) => n + Number(g.player_count || 0), 0)}
          </strong>
          <span>Players across sessions</span>
        </article>
        <article>
          <Icon name="calendar-days" className="icon--size-24" />
          <strong>
            {
              games.filter((g) => g.status === "live" || g.live_sessions > 0)
                .length
            }
          </strong>
          <span>Live games</span>
        </article>
      </div>
      <section className="sa-panel">
        <div className="sa-toolbar">
          <label>
            <Icon name="search" className="icon--size-17" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search game or host email"
            />
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {loading ? (
          <p className="sa-muted">Loading platform games…</p>
        ) : filtered.length ? (
          <GameTable games={filtered} onInspect={onInspect} />
        ) : (
          <p className="sa-muted">No games match this search.</p>
        )}
      </section>
      <Link className="sa-back" to="/host">
        <Icon name="arrow-left" className="icon--size-15" /> Back to Host Hub
      </Link>
      {inspectorOpen && (
        <GameInspector
          selected={selected}
          detailLoading={detailLoading}
          onClose={onCloseInspector}
          feedback={inspectorFeedback}
          onRetry={onRetryInspection}
        />
      )}
    </>
  );
}
