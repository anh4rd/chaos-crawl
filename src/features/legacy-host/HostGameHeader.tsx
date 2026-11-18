import LiveStatus from "../../components/ui/LiveStatus";
import DisplayHeading from "../../components/ui/DisplayHeading";
import Overline from "../../components/ui/Overline";
import Icon from "../../components/ui/Icon";
export default function HostGameHeader({
  currentAvailable,
  playerCount,
}: {
  currentAvailable: boolean;
  playerCount: number;
}) {
  return (
    <header className="legacy-host__header">
      <div className="legacy-host__brand-row">
        <div>
          <Overline variant="console-eyebrow" as="p">
            CHAOS · HOST CONTROL
          </Overline>
          <DisplayHeading variant="console-brand" as="h1">
            Run the game
          </DisplayHeading>
        </div>
        <LiveStatus live={currentAvailable}>
          {currentAvailable ? "LIVE" : "READY"}
        </LiveStatus>
      </div>
      <div className="legacy-host__event-row">
        <span>
          <Icon name="map-pin" className="icon--size-14" /> One venue · No
          travel between rounds
        </span>
        <span>{playerCount} players</span>
      </div>
    </header>
  );
}
