import { useCallback, useEffect, useState } from "react";
import { revealScheduledChallenge } from "../../lib/gameApi";
import { apiError } from "../../lib/apiResult";
import type { GameState } from "../../types/database";

const MAX_TIMEOUT_MS = 2_147_483_647;

/** Each observed schedule gets one attempt. Realtime changes cancel pending
 * work; failures require an explicit retry instead of repeatedly writing.
 */
export function useScheduledReveal(game: GameState | null) {
  const challengeId = game?.scheduled_challenge_id ?? null;
  const scheduledAt = game?.scheduled_reveal_at ?? null;
  const key = JSON.stringify([challengeId, scheduledAt]);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ key: string; error: Error } | null>(
    null,
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    setFailure(null);
    if (challengeId === null && scheduledAt === null) return;
    const deadline = scheduledAt === null ? NaN : Date.parse(scheduledAt);
    if (
      challengeId === null ||
      scheduledAt === null ||
      !Number.isFinite(challengeId) ||
      !Number.isFinite(deadline)
    ) {
      setFailure({
        key,
        error: new Error(
          "Scheduled reveal failed: the challenge or time is invalid. Change or cancel the schedule, then retry.",
        ),
      });
      return;
    }
    const scheduledChallengeId = challengeId;
    const scheduledTime = scheduledAt;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function reveal() {
      try {
        const result = await revealScheduledChallenge(
          scheduledChallengeId,
          scheduledTime,
          controller.signal,
        );
        if (!controller.signal.aborted && result.error) {
          setFailure({
            key,
            error: new Error(
              `Scheduled reveal failed: ${result.error.message}. Retry to try again.`,
            ),
          });
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setFailure({
            key,
            error: new Error(
              `Scheduled reveal failed: ${apiError(cause).message}. Retry to try again.`,
            ),
          });
      }
    }
    function waitUntilDue() {
      const remaining = deadline - Date.now();
      if (remaining > 0)
        timer = setTimeout(waitUntilDue, Math.min(remaining, MAX_TIMEOUT_MS));
      else void reveal();
    }
    waitUntilDue();
    return () => {
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [challengeId, scheduledAt, key, attempt]);

  return { error: failure?.key === key ? failure.error : null, retry };
}
