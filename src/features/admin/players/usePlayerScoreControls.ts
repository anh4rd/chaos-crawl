import { useState } from "react";
import { addPoints, removePoints } from "../../../lib/playerApi";
import { useAdminOperation } from "../useAdminOperation";
export function usePlayerScoreControls(reloadScores: () => Promise<void>) {
  const run = useAdminOperation();
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  async function changePoints(playerId: string, amount: number) {
    await run(
      async (current) => {
        setSavingPlayerId(playerId);
        try {
          const { error } = await (amount < 0
            ? removePoints(playerId, -amount)
            : addPoints(playerId, amount));
          if (!current()) return;
          if (error) {
            alert(`Could not update score: ${error.message}`);
            return;
          }
          await reloadScores();
        } finally {
          if (current()) setSavingPlayerId(null);
        }
      },
      (cause) =>
        alert(
          `Could not update score: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
        ),
    );
  }
  return { savingPlayerId, changePoints };
}
