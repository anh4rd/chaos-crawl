import { useMemo, useState } from "react";
import HostWorkspace from "../host-workspace/HostWorkspace";
import PlatformGamesView from "./PlatformGamesView";
import { usePlatformGames } from "./usePlatformGames";
import { useGameInspector } from "./useGameInspector";
import "../../styles/HostPortal.css";
import "../../styles/HostPlanning.css";

export default function PlatformGames() {
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const { games, loading, denied, load } = usePlatformGames(setError);
  const { selected, detailLoading, openGame, close } =
    useGameInspector(setError);
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
        error={error}
        denied={denied}
        query={query}
        status={status}
        selected={selected}
        detailLoading={detailLoading}
        onRefresh={() => void load()}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onInspect={(id) => void openGame(id)}
        onCloseInspector={close}
      />
    </HostWorkspace>
  );
}
