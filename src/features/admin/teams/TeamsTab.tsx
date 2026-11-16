import QueryPanel from "../QueryPanel";
import { useTeamManagement } from "./useTeamManagement";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useTeams } from "../../../game/hooks/useTeams";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function TeamsTab() {
  const playersQuery = usePlayers();
  const { data: players, reload: reloadPlayers } = playersQuery;
  const teamsQuery = useTeams();
  const { data: teams, reload: loadTeams } = teamsQuery;
  const {
    newTeamName,
    setNewTeamName,
    creatingTeam,
    assigningPlayerIds,
    createTeam,
    assignTeam,
  } = useTeamManagement({ reloadTeams: loadTeams, reloadPlayers });
  return (
    <QueryPanel
      queries={[playersQuery, teamsQuery]}
      loadingText="Loading teams and players..."
    >
      <>
        <Card>
          <h2 className="text-2xl font-bold">Create Teams</h2>

          <div className="mt-4 space-y-3">
            <Input
              placeholder="Team name..."
              value={newTeamName}
              onChange={(event) => setNewTeamName(event.target.value)}
            />

            <Button type="button" disabled={creatingTeam} onClick={createTeam}>
              {creatingTeam ? "Creating..." : "Create Team"}
            </Button>
          </div>

          {teams.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {teams.map((team) => (
                <span
                  key={team.id}
                  className="rounded-full bg-zinc-800 px-3 py-2 text-sm"
                >
                  {team.name}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold">Assign Teams</h2>

          <div className="mt-4 space-y-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-xl border border-zinc-700 bg-black/50 p-4"
              >
                <strong>{player.name}</strong>

                <select
                  value={player.team ?? ""}
                  aria-label={`Team for ${player.name}`}
                  disabled={assigningPlayerIds.has(player.id)}
                  onChange={(event) => {
                    void assignTeam(player.id, event.target.value);
                  }}
                  className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
                >
                  <option value="">Unassigned</option>

                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Card>
      </>
    </QueryPanel>
  );
}
