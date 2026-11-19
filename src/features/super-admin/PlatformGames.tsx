import SessionFeedback from "../../components/session/SessionFeedback";
import { useMemo, useState } from "react";
import HostWorkspace from "../host-workspace/HostWorkspace";
import PlatformGamesView from "./PlatformGamesView";
import { usePlatformGames } from "./usePlatformGames";
import { useGameInspector } from "./useGameInspector";

export default function PlatformGames() {
  const [queryError, setQueryError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const { games, loading, denied, load } = usePlatformGames(setQueryError);
  const { selected, detailLoading, isOpen, openGame, close, retry } =
    useGameInspector(setDetailError);
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
          `${g.name} ${g.host_email ?? ""}`
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
          clearFeedback();
          void openGame(id);
        }}
        onCloseInspector={close}
      />
    </HostWorkspace>
  );
}
