import NativeSelect from "../../../components/ui/NativeSelect";
import ContentPanel from "../../../components/ui/ContentPanel";
import Badge from "../../../components/ui/Badge";
import ControlRow from "../../../components/ui/ControlRow";
import PanelGrid from "../../../components/ui/PanelGrid";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
export default function TeamsView({
  players,
  teams,
  newTeamName,
  creatingTeam,
  assigningPlayerIds,
  onNewTeamName,
  onCreateTeam,
  onAssignTeam,
}: {
  players: readonly {
    id: string;
    name: string;
    team: string | null;
  }[];
  teams: readonly {
    id: string;
    name: string;
  }[];
  newTeamName: string;
  creatingTeam: boolean;
  assigningPlayerIds: ReadonlySet<string>;
  onNewTeamName: (name: string) => void;
  onCreateTeam: () => Promise<void>;
  onAssignTeam: (id: string, team: string) => Promise<void>;
}) {
  return (
    <>
      <Card>
        <DisplayHeading variant="plain">Create Teams</DisplayHeading>

        <PanelGrid variant="feed-tight">
          <Input
            placeholder="Team name..."
            value={newTeamName}
            onChange={(event) => onNewTeamName(event.target.value)}
          />

          <Button type="button" disabled={creatingTeam} onClick={onCreateTeam}>
            {creatingTeam ? "Creating..." : "Create Team"}
          </Button>
        </PanelGrid>

        {teams.length > 0 && (
          <ControlRow variant="chips">
            {teams.map((team) => (
              <Badge key={team.id} variant="team-name">
                {team.name}
              </Badge>
            ))}
          </ControlRow>
        )}
      </Card>

      <Card>
        <DisplayHeading variant="plain">Assign Teams</DisplayHeading>

        <PanelGrid variant="feed">
          {players.map((player) => (
            <ContentPanel key={player.id} as="div" variant="ledger">
              <strong>{player.name}</strong>

              <NativeSelect
                value={player.team ?? ""}
                aria-label={`Team for ${player.name}`}
                disabled={assigningPlayerIds.has(player.id)}
                onChange={(event) => {
                  void onAssignTeam(player.id, event.target.value);
                }}
                spacing="regular"
              >
                <option value="">Unassigned</option>

                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </NativeSelect>
            </ContentPanel>
          ))}
        </PanelGrid>
      </Card>
    </>
  );
}
