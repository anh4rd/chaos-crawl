import { useEffect, useRef, useState } from "react";
import { failedResult } from "../../lib/apiResult";
import { updatePlatformPlayer } from "../../lib/superAdminCommands";
import { readPlatformSessionPlayers } from "../../lib/superAdminQueries";
import type {
  PlatformPlayerUpdate,
  PlatformSessionPlayers,
} from "../../types/superAdmin";

export function usePlatformPlayers(
  setError: (message: string) => void,
  onSaved: () => void,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<PlatformSessionPlayers | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const activeSession = useRef<string | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, []);

  function close() {
    generation.current += 1;
    activeSession.current = null;
    lock.current = false;
    setIsOpen(false);
    setData(null);
    setLoading(false);
    setBusy(false);
    setError("");
  }
  async function open(sessionId: string) {
    const request = ++generation.current;
    activeSession.current = sessionId;
    lock.current = false;
    setIsOpen(true);
    setData(null);
    setBusy(false);
    setLoading(true);
    setError("");
    const result =
      await readPlatformSessionPlayers(sessionId).catch(failedResult);
    if (!mounted.current || generation.current !== request) return;
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Couldn't load the session players.");
      return;
    }
    setData(result.data);
  }
  async function save(
    playerId: string,
    values: PlatformPlayerUpdate,
    expected: PlatformPlayerUpdate,
  ) {
    const sessionId = activeSession.current;
    if (!sessionId || lock.current) return false;
    const request = generation.current;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await updatePlatformPlayer(
        sessionId,
        playerId,
        values,
        expected,
      ).catch(failedResult);
      if (!mounted.current || generation.current !== request) return false;
      if (result.error) {
        setError(result.error.message);
        return false;
      }
      const refreshed =
        await readPlatformSessionPlayers(sessionId).catch(failedResult);
      if (!mounted.current || generation.current !== request) return false;
      if (refreshed.error || !refreshed.data) {
        setError(
          "Player saved, but the list couldn't refresh. Return to the game and retry.",
        );
        return false;
      }
      setData(refreshed.data);
      onSaved();
      return true;
    } finally {
      if (mounted.current && generation.current === request) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  return {
    isOpen,
    data,
    loading,
    busy,
    open,
    close,
    save,
    retry: () => {
      if (activeSession.current) void open(activeSession.current);
    },
  };
}
