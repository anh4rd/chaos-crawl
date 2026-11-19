import { useEffect, useRef, useState } from "react";
import { readPlatformGameDetail } from "../../lib/superAdminQueries";
import type { PlatformGameDetail } from "../../types/superAdmin";

export function useGameInspector(setError: (message: string) => void) {
  const [selected, setSelected] = useState<PlatformGameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  const latestRead = useRef(0);
  const activeId = useRef<string | null>(null);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function openGame(id: string) {
    if (!mounted.current) return;
    const request = ++latestRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      latestRead.current === request;
    activeId.current = id;
    setIsOpen(true);
    setSelected(null);
    setDetailLoading(true);
    setError("");
    const { data, error: rpcError } = await readPlatformGameDetail(id);
    if (!current()) return;
    setDetailLoading(false);
    if (rpcError || !data) {
      setError(rpcError?.message ?? "Game details are unavailable.");
      return;
    }
    setSelected(data);
  }
  function close() {
    latestRead.current += 1;
    activeId.current = null;
    if (!mounted.current) return;
    setIsOpen(false);
    setDetailLoading(false);
    setSelected(null);
    setError("");
  }
  function retry() {
    const id = activeId.current;
    return id === null ? Promise.resolve() : openGame(id);
  }
  return { selected, detailLoading, isOpen, openGame, close, retry };
}
