import { useState } from "react";
import { addPoints, removePoints } from "../../../lib/playerApi";
export function usePlayerScoreControls(reloadScores: () => Promise<void>) {
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  async function changePoints(playerId: string, amount: number) {
    setSavingPlayerId(playerId);
    try {
      const { error } = await (amount < 0
        ? removePoints(playerId, -amount)
        : addPoints(playerId, amount));
      if (error) {
        alert(`Could not update score: ${error.message}`);
        return;
      }
      await reloadScores();
    } catch (cause) {
      alert(
        `Could not update score: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      setSavingPlayerId(null);
    }
  }
  return { savingPlayerId, changePoints };
}
