import ContextCard from "../../components/ui/ContextCard";
import Ribbon from "../../components/ui/Ribbon";
import Icon from "../../components/ui/Icon";
import CoverArtwork from "../../components/ui/CoverArtwork";
import { dateLabel } from "../../utils/hostDate";
import type { HostGame } from "../../types/hostHub";
export default function GameOverview({
  dashboardGame,
  readOnly,
  onEdit,
}: {
  dashboardGame: HostGame | null;
  readOnly: boolean;
  onEdit: (id: string) => void;
}) {
  return (
    <ContextCard className="game-overview">
      <Ribbon>GAME OVERVIEW</Ribbon>
      {dashboardGame ? (
        <>
          <CoverArtwork variant="overview" name={dashboardGame.name} />
          <div className="game-overview__details">
            <h3>{dashboardGame.name}</h3>
            <ul>
              <li>
                <Icon name="calendar-days" className="icon--size-15" />
                {dateLabel(dashboardGame.event_date)}
              </li>
              <li>
                <Icon name="users" className="icon--size-15" />
                {dashboardGame.player_count} players (target)
              </li>
              <li>
                <Icon name="map-pin" className="icon--size-15" />
                {dashboardGame.venue_name || "Venue not set"}
              </li>
            </ul>
          </div>
          <button
            type="button"
            className="game-overview__edit"
            aria-label="Edit game overview"
            onClick={() => onEdit(dashboardGame.id)}
            disabled={readOnly}
          >
            <Icon name="edit3" className="icon--size-17" />
          </button>
        </>
      ) : (
        <div className="game-overview__empty">
          <h3>No game selected</h3>
          <p>Create a plan and your overview will appear here.</p>
        </div>
      )}
    </ContextCard>
  );
}
