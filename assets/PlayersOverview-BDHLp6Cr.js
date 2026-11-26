var e=`import Overline from "../../components/ui/Overline";
import PageIntroduction from "../../components/ui/PageIntroduction";
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
      <PageIntroduction>
        <Overline variant="console-eyebrow" as="p">
          THE PARTY
        </Overline>
        <h2>Players & teams</h2>
        <p>Manage your roster and keep teams balanced.</p>
      </PageIntroduction>
      <TeamPanel {...teams} />
      <PlayerRoster {...roster} />
    </>
  );
}
`;export{e as default};