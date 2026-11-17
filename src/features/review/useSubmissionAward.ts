import { useEffect, useRef, useState } from "react";
import { apiError } from "../../lib/apiResult";
import { awardScore } from "../../lib/scoreApi";
import type { ChallengeType, Player } from "../../types/database";

export function useSubmissionAward(
  player: Player | undefined,
  challengeType: ChallengeType,
  challengeId: string,
  challengeTitle: string,
) {
  const [points, setPoints] = useState("");
  const [recipient, setRecipient] = useState<"player" | "team">("player");
  const [awarding, setAwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const active = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function award() {
    if (pending.current) return;
    setError(null);
    setNotice(null);
    const amount = Number(points);
    if (!player) {
      setError("Could not find player. Refresh the player list.");
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      setError("Enter a finite, nonzero points amount.");
      return;
    }
    if (recipient === "team" && !player.team) {
      setError("This player is not assigned to a team.");
      return;
    }
    pending.current = true;
    setAwarding(true);
    try {
      const result = await awardScore({
        playerId: recipient === "player" ? player.id : null,
        teamName: recipient === "team" ? player.team : null,
        challengeType,
        challengeId,
        challengeTitle,
        points: amount,
        reason: `Awarded from ${challengeTitle}`,
      });
      if (result.error) throw result.error;
      if (active.current) {
        setNotice(`Awarded ${amount} points!`);
        setPoints("");
      }
    } catch (cause) {
      if (active.current)
        setError(`Could not award points: ${apiError(cause).message}`);
    } finally {
      pending.current = false;
      if (active.current) setAwarding(false);
    }
  }

  return {
    points,
    setPoints,
    recipient,
    setRecipient,
    awarding,
    error,
    notice,
    award,
  };
}
