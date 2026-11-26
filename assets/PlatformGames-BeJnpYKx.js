var e=`import SessionFeedback from "../../components/session/SessionFeedback";
import { useMemo, useState } from "react";
import HostWorkspace from "../host-workspace/HostWorkspace";
import PlatformGamesView from "./PlatformGamesView";
import { usePlatformGames } from "./usePlatformGames";
import { useGameInspector } from "./useGameInspector";
import { usePlatformPlayers } from "./usePlatformPlayers";
import SessionPlayers from "./SessionPlayers";
import Button from "../../components/ui/Button";
import GameCohostManager from "../host-hub/GameCohostManager";
import type { PlatformGame } from "../../types/superAdmin";

export default function PlatformGames() {
  const [queryError, setQueryError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [cohostGame, setCohostGame] = useState<PlatformGame | null>(null);
  const { games, loading, denied, load } = usePlatformGames(setQueryError);
  const { selected, detailLoading, isOpen, openGame, close, retry } =
    useGameInspector(setDetailError);
  const players = usePlatformPlayers(setDetailError, () => void retry());
  const error = detailError || queryError;
  function clearFeedback() {
    setQueryError("");
    setDetailError("");
  }
  const filtered = useMemo(
    () =>
      games.filter(
        (g) =>
          (status === "all" || g.status === status) &&
          \`\${g.name} \${g.host_email ?? ""}\`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [games, status, query],
  );
  return (
    <HostWorkspace title="Super Admin" subtitle="Platform-wide game oversight.">
      <PlatformGamesView
        games={games}
        filtered={filtered}
        loading={loading}
        error={isOpen ? "" : error}
        inspectorOpen={isOpen}
        inspectorFeedback={
          error ? (
            <SessionFeedback message={error} onDismiss={clearFeedback} />
          ) : undefined
        }
        onRetryInspection={() => {
          clearFeedback();
          void retry();
        }}
        denied={denied}
        query={query}
        status={status}
        selected={selected}
        detailLoading={detailLoading}
        onRefresh={() => void load()}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onInspect={(id) => {
          players.close();
          clearFeedback();
          void openGame(id);
        }}
        onCloseInspector={() => {
          players.close();
          close();
        }}
        onManagePlayers={(sessionId) => void players.open(sessionId)}
        onManageCohosts={setCohostGame}
        playerContent={
          players.isOpen ? (
            <>
              <Button
                type="button"
                variant="comic-secondary"
                fullWidth={false}
                onClick={players.close}
              >
                Back to game
              </Button>
              {players.loading ? (
                <p>Loading players…</p>
              ) : players.data ? (
                <SessionPlayers
                  data={players.data}
                  busy={players.busy}
                  onSave={players.save}
                />
              ) : (
                <Button
                  type="button"
                  variant="comic-secondary"
                  fullWidth={false}
                  onClick={players.retry}
                >
                  Retry loading players
                </Button>
              )}
            </>
          ) : undefined
        }
      />
      {cohostGame && (
        <GameCohostManager
          key={cohostGame.game_id}
          game={{ id: cohostGame.game_id, name: cohostGame.name }}
          allowRemove={false}
          onClose={() => setCohostGame(null)}
        />
      )}
    </HostWorkspace>
  );
}
`;export{e as default};