import Icon from "../../components/ui/Icon";
export default function HostGameHeader({
  currentAvailable,
  playerCount,
}: {
  currentAvailable: boolean;
  playerCount: number;
}) {
  return (
    <header className="host-v2__header">
      <div className="host-v2__brand-row">
        <div>
          <p className="host-v2__eyebrow">CHAOS · HOST CONTROL</p>
          <h1 className="host-v2__brand">Run the game</h1>
        </div>
        <span
          className={`host-v2__live-pill ${currentAvailable ? "is-live" : "is-ready"}`}
        >
          <span className="host-v2__live-dot" />
          {currentAvailable ? "LIVE" : "READY"}
        </span>
      </div>
      <div className="host-v2__event-row">
        <span>
          <Icon name="map-pin" className="icon--size-14" /> One venue · No
          travel between rounds
        </span>
        <span>{playerCount} players</span>
      </div>
    </header>
  );
}
