import { useRef } from "react";
import { deletePlayer } from "../../../lib/playerApi";
import { useAdminLifetime } from "../useAdminLifetime";
export function usePlayerRemoval(reload: () => Promise<void>) {
  const captureLifetime = useAdminLifetime();
  const pending = useRef(new Set<string>());
  return async (id: string, name: string) => {
    const current = captureLifetime();
    if (!current() || pending.current.has(id)) return;
    if (!window.confirm(`Delete ${name}?`)) return;
    pending.current.add(id);
    try {
      const { error } = await deletePlayer(id);
      if (!current()) return;
      if (error) {
        alert(`Could not delete player: ${error.message}`);
        return;
      }
      await reload();
    } catch (cause) {
      if (current())
        alert(
          `Could not delete player: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
        );
    } finally {
      if (current()) pending.current.delete(id);
    }
  };
}
