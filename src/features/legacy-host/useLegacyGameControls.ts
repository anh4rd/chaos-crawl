import { useEffect, useRef, useState } from "react";
import { useHostOperation } from "../host-live/useHostOperation";
import { apiError } from "../../lib/apiResult";
import { updateGameState } from "../../lib/gameApi";
import type { Challenge, GameState } from "../../types/database";
import type { HostRound } from "./models";
import type { ScoreTarget } from "./types";
export function useLegacyGameControls({
  game,
  rounds,
  onShowLive,
}: {
  game: GameState | null;
  rounds: HostRound[];
  onShowLive: () => void;
}) {
  const { setBusy } = useHostOperation();
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
      setBusy(false);
    };
  }, [setBusy]);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [scheduleMinutes, setScheduleMinutes] = useState("15");
  const [voteTarget, setVoteTarget] = useState<ScoreTarget>("player");
  const runBusy = async (
    key: string | null,
    operation: (current: () => boolean) => Promise<void>,
  ) => {
    if (!mounted.current || !setBusy(true)) return;
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (key) setBusyAction(key);
    try {
      await operation(current);
    } catch (error) {
      if (current())
        window.alert(`Could not update game: ${apiError(error).message}`);
    } finally {
      if (current()) {
        setBusyAction(null);
        setBusy(false);
      }
    }
  };
  async function revealChallenge(challenge: Challenge) {
    const round = rounds.find((item) =>
      item.challenges.some(
        (entry) => String(entry.id) === String(challenge.id),
      ),
    );
    await runBusy(`reveal-${challenge.id}`, async (current) => {
      const { error } = await updateGameState({
        current_pub:
          round?.legacyName ?? game?.current_pub ?? "Stationary venue",
        current_challenge_id: Number(challenge.id),
        current_challenge: challenge.title,
        challenge_description: challenge.description ?? "",
        current_challenge_order: challenge.reveal_order ?? 0,
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
        scheduled_challenge_id: null,
        scheduled_reveal_at: null,
      });
      if (!current()) return;
      if (error) {
        window.alert(`Could not reveal challenge: ${error.message}`);
        return;
      }
      onShowLive();
    });
  }
  async function scheduleChallenge(challenge: Challenge) {
    if (!mounted.current) return;
    const minutes = Number(scheduleMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 240) {
      window.alert("Enter a reveal time between 1 and 240 minutes.");
      return;
    }
    await runBusy(`schedule-${challenge.id}`, async (current) => {
      const revealAt = new Date(Date.now() + minutes * 60_000).toISOString();
      const { error } = await updateGameState({
        scheduled_challenge_id: Number(challenge.id),
        scheduled_reveal_at: revealAt,
      });
      if (!current()) return;
      if (error) {
        window.alert(`Could not schedule challenge: ${error.message}`);
        return;
      }
      onShowLive();
    });
  }
  async function cancelScheduledReveal() {
    await runBusy("cancel-schedule", async (current) => {
      const { error } = await updateGameState({
        scheduled_challenge_id: null,
        scheduled_reveal_at: null,
      });
      if (!current()) return;
      if (error) {
        window.alert(`Could not cancel schedule: ${error.message}`);
        return;
      }
    });
  }
  async function setVoting(open: boolean, target: ScoreTarget = voteTarget) {
    await runBusy(null, async (current) => {
      const { error } = await updateGameState(
        open
          ? {
              voting_open: true,
              voting_target: target,
              show_vote_results: false,
              slideshow_open: false,
            }
          : {
              voting_open: false,
              show_vote_results: true,
              slideshow_open: false,
            },
      );
      if (current() && error)
        window.alert(`Could not update voting: ${error.message}`);
    });
  }
  async function returnEveryoneToGame() {
    await runBusy(null, async (current) => {
      const { error } = await updateGameState({
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
      });
      if (current() && error)
        window.alert(`Could not return everyone to the game: ${error.message}`);
    });
  }
  async function setSlideshow(open: boolean) {
    await runBusy(null, async (current) => {
      const { error } = await updateGameState({
        slideshow_open: open,
        ...(open ? { voting_open: false, show_vote_results: false } : {}),
      });
      if (current() && error)
        window.alert(`Could not update the slideshow: ${error.message}`);
    });
  }
  return {
    busyAction,
    scheduleMinutes,
    setScheduleMinutes,
    voteTarget,
    setVoteTarget,
    revealChallenge,
    scheduleChallenge,
    cancelScheduledReveal,
    setVoting,
    returnEveryoneToGame,
    setSlideshow,
  };
}
