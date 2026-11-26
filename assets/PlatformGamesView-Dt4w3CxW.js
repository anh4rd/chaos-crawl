var e=`import FormLabel from "../../components/ui/FormLabel";
import ControlRow from "../../components/ui/ControlRow";
import type { MouseEvent, ReactNode } from "react";
import Button from "../../components/ui/Button";
import ButtonLink from "../../components/ui/ButtonLink";
import Icon from "../../components/ui/Icon";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import Note from "../../components/ui/Note";
import PanelGrid from "../../components/ui/PanelGrid";
import StatTile from "../../components/ui/StatTile";
import ContentPanel from "../../components/ui/ContentPanel";
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
  onBack,
  playerContent,
  onManagePlayers,
  onManageCohosts,
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
  onBack?: (event: MouseEvent<HTMLAnchorElement>) => void;
  playerContent?: ReactNode;
  onManagePlayers?: (sessionId: string) => void;
  onManageCohosts?: (game: PlatformGame) => void;
}) {
  return (
    <>
      <PanelHeading variant="overview">
        <div>
          <Overline variant="inverse">
            <Icon name="shield-check" className="icon--size-15" /> PLATFORM
            OWNER
          </Overline>
          <h2>All games</h2>
          <Note variant="inverse">
            View games created by every host account.
          </Note>
        </div>
        <Button variant="comic-secondary" fullWidth={false} onClick={onRefresh}>
          <Icon name="refresh-cw" className="icon--size-16" /> Refresh
        </Button>
      </PanelHeading>
      {error && (
        <ContentPanel as="div" variant="workspace-error">
          {error}
        </ContentPanel>
      )}
      {denied && (
        <ContentPanel as="div" variant="notice">
          This account isn't provisioned as a Super Admin. Run the supplied
          migration while signed in with the designated account, then refresh.
        </ContentPanel>
      )}
      <PanelGrid variant="stats">
        <StatTile
          variant="summary"
          icon="gamepad2"
          value={games.length}
          label="Total games"
        />
        <StatTile
          variant="summary"
          icon="users"
          value={games.reduce(
            (total, game) => total + Number(game.player_count || 0),
            0,
          )}
          label="Players across sessions"
        />
        <StatTile
          variant="summary"
          icon="calendar-days"
          value={
            games.filter(
              (game) => game.status === "live" || game.live_sessions > 0,
            ).length
          }
          label="Live games"
        />
      </PanelGrid>
      <ContentPanel variant="table">
        <ControlRow variant="filters">
          <FormLabel variant="filter">
            <span>Search games</span>
            <Icon name="search" className="icon--size-17" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search game or host email"
            />
          </FormLabel>
          <FormLabel variant="filter">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </FormLabel>
        </ControlRow>
        {loading ? (
          <Note variant="inverse">Loading platform games…</Note>
        ) : filtered.length ? (
          <GameTable
            games={filtered}
            onInspect={onInspect}
            onManageCohosts={onManageCohosts}
          />
        ) : (
          <Note variant="inverse">No games match this search.</Note>
        )}
      </ContentPanel>
      <ButtonLink
        variant="back-link"
        fullWidth={false}
        to="/host"
        onClick={onBack}
      >
        <Icon name="arrow-left" className="icon--size-15" /> Back to Host Hub
      </ButtonLink>
      {inspectorOpen && (
        <GameInspector
          selected={selected}
          detailLoading={detailLoading}
          onClose={onCloseInspector}
          feedback={inspectorFeedback}
          onRetry={onRetryInspection}
          playerContent={playerContent}
          onManagePlayers={onManagePlayers}
        />
      )}
    </>
  );
}
`;export{e as default};