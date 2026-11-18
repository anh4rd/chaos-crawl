import { useCallback, useEffect, useState } from "react";
import { readPlatformGames } from "../../lib/superAdminQueries";
import type { PlatformGame } from "../../types/superAdmin";

export function usePlatformGames(setError: (message: string) => void) {
  const [games, setGames] = useState<PlatformGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setDenied(false);
    const { data, error: rpcError } = await readPlatformGames();
    if (rpcError) {
      setError(rpcError.message);
      setDenied(
        rpcError.message.toLowerCase().includes("not authorised") ||
          rpcError.message.toLowerCase().includes("not authorized"),
      );
      setLoading(false);
      return;
    }
    setGames(data ?? []);
    setLoading(false);
  }, [setError]);
  useEffect(() => {
    void load();
  }, [load]);
  return { games, loading, denied, load };
}
