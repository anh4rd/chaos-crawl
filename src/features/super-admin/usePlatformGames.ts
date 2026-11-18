import { useCallback, useEffect, useRef, useState } from "react";
import { readPlatformGames } from "../../lib/superAdminQueries";
import type { PlatformGame } from "../../types/superAdmin";

export function usePlatformGames(setError: (message: string) => void) {
  const [games, setGames] = useState<PlatformGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  const latestRead = useRef(0);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++latestRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      latestRead.current === request;
    setLoading(true);
    setError("");
    setDenied(false);
    const { data, error: rpcError } = await readPlatformGames();
    if (!current()) return;
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
