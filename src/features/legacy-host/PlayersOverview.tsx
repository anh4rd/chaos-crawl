import TeamPanel from "./TeamPanel";
import PlayerRoster from "./PlayerRoster";
import type { TeamPanelModel, PlayerRosterModel } from "./types";
export default function PlayersOverview({
  teams,
  roster,
}: {
  teams: TeamPanelModel;
  roster: PlayerRosterModel;
}) {
  return (
    <>
      <div className="host-v2__page-intro">
        <p className="host-v2__eyebrow">THE PARTY</p>
        <h2>Players & teams</h2>
        <p>Manage your roster and keep teams balanced.</p>
      </div>
      <TeamPanel {...teams} />
      <PlayerRoster {...roster} />
    </>
  );
}
