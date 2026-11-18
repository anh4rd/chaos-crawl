import { useState } from "react";
import { readPlatformGameDetail } from "../../lib/superAdminQueries";
import type { PlatformGameDetail } from "../../types/superAdmin";

export function useGameInspector(setError: (message: string) => void) {
  const [selected, setSelected] = useState<PlatformGameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  async function openGame(id: string) {
    setDetailLoading(true);
    setError("");
    const { data, error: rpcError } = await readPlatformGameDetail(id);
    setDetailLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSelected(data);
  }
  return { selected, detailLoading, openGame, close: () => setSelected(null) };
}
