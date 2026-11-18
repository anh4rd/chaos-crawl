import QueryPanel from "../QueryPanel";
import { useTeamManagement } from "./useTeamManagement";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useTeams } from "../../../game/hooks/useTeams";

import TeamsView from "./TeamsView";
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
      <TeamsView
        players={players}
        teams={teams}
        newTeamName={newTeamName}
        creatingTeam={creatingTeam}
        assigningPlayerIds={assigningPlayerIds}
        onNewTeamName={setNewTeamName}
        onCreateTeam={createTeam}
        onAssignTeam={assignTeam}
      />
    </QueryPanel>
  );
}
