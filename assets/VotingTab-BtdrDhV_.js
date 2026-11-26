var e=`import { useVotes } from "../../../game/hooks/useVotes";
import QueryPanel from "../QueryPanel";
import { useNavigate } from "react-router-dom";
import { updateGameState } from "../../../lib/gameApi";
import { tallyPlayerVotes, tallyTeamVotes } from "../../../lib/voteResults";
import { useGameState } from "../../../game/hooks/useGameState";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useTeams } from "../../../game/hooks/useTeams";
import * as commands from "./votingControls";
import { useAdminOperation } from "../useAdminOperation";

import VotingView from "./VotingView";
export default function VotingTab() {
  const run = useAdminOperation();
  const onFailure = (cause: unknown) =>
    alert(
      \`Could not update voting: \${cause instanceof Error ? cause.message : "Unexpected error"}\`,
    );
  const gameQuery = useGameState();
  const { data: game } = gameQuery;
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const teamsQuery = useTeams();
  const { data: teams } = teamsQuery;
  const votesQuery = useVotes(game?.current_challenge);
  const { data: votes } = votesQuery;
  const navigate = useNavigate();
  const liveResults =
    game?.voting_target === "team"
      ? tallyTeamVotes(votes, teams)
      : tallyPlayerVotes(votes, players);
  async function changeTarget(value: string) {
    if (value !== "player" && value !== "team") return;
    await run(async (current) => {
      const { error } = await updateGameState({ voting_target: value });
      if (current() && error)
        alert(\`Could not change voting target: \${error.message}\`);
    }, onFailure);
  }
  return (
    <QueryPanel
      queries={[gameQuery, playersQuery, teamsQuery, votesQuery]}
      loadingText="Loading voting controls..."
    >
      <VotingView
        game={game}
        liveResults={liveResults}
        onTarget={changeTarget}
        onOpenVoting={() => run(commands.openVoting, onFailure)}
        onCloseVoting={() => run(commands.closeVoting, onFailure)}
        onCloseResults={() => run(commands.closeResults, onFailure)}
        onNavigate={navigate}
      />
    </QueryPanel>
  );
}
`;export{e as default};