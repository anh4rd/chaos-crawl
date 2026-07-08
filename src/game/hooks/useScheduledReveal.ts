import {
  useEffect,
  useMemo,
} from "react";

import type {
  GameState,
} from "./useGameState";

interface ScheduledRevealState {
  scheduledRevealAt:
    string | null;

  hasScheduledReveal:
    boolean;

  revealIsDue:
    boolean;
}

export default function useScheduledReveal(
  game: GameState | null
): ScheduledRevealState {
  const scheduledRevealAt =
    game?.scheduled_reveal_at ??
    null;

  const hasScheduledReveal =
    Boolean(
      scheduledRevealAt
    );

  const revealIsDue =
    useMemo(() => {
      if (!scheduledRevealAt) {
        return false;
      }

      const target =
        new Date(
          scheduledRevealAt
        ).getTime();

      if (
        Number.isNaN(target)
      ) {
        return false;
      }

      return (
        target <= Date.now()
      );
    }, [
      scheduledRevealAt,
    ]);

  useEffect(() => {
    // This hook deliberately does not
    // run a one-second interval.
    //
    // The visual countdown is isolated
    // inside ScheduledCountdown.
  }, []);

  return {
    scheduledRevealAt,
    hasScheduledReveal,
    revealIsDue,
  };
}