var e=`import QueryPanel from "../QueryPanel";
import { buildLeaderboards } from "../../../lib/leaderboard";
import { useScoreEvents } from "../../../game/hooks/useScoreEvents";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { usePlayerRemoval } from "./usePlayerRemoval";
import PlayerNameEditor from "./PlayerNameEditor";

import PlayersView from "./PlayersView";
import { usePlayerScoreControls } from "./usePlayerScoreControls";
export default function PlayersTab() {
  const playersQuery = usePlayers();
  const { data: players, reload } = playersQuery;
  const scoresQuery = useScoreEvents();
  const { data: scoreEvents, reload: reloadScores } = scoresQuery;
  const scores = new Map(
    buildLeaderboards(players, scoreEvents).players.map((entry) => [
      entry.id,
      entry.score,
    ]),
  );
  const { savingPlayerId, changePoints } = usePlayerScoreControls(reloadScores);
  const remove = usePlayerRemoval(reload);
  return (
    <QueryPanel
      queries={[playersQuery, scoresQuery]}
      loadingText="Loading players and scores..."
    >
      <PlayersView
        players={players.map((player) => ({
          id: player.id,
          name: player.name,
          team: player.team,
          score: scores.get(player.id) ?? 0,
        }))}
        savingPlayerId={savingPlayerId}
        onChangePoints={changePoints}
        onRemove={remove}
        renderNameEditor={(player) => (
          <PlayerNameEditor
            playerId={player.id}
            name={player.name}
            reload={reload}
          />
        )}
      />
    </QueryPanel>
  );
}
`;export{e as default};