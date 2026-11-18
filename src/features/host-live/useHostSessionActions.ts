import type { Dispatch, RefObject, SetStateAction } from "react";
import * as hostRosterCommands from "../../lib/hostRosterCommands";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import type {
  GameSession,
  SessionChallenge,
  SessionPlayer,
  SessionTeam,
} from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  autoplayEnabled: boolean;
  players: SessionPlayer[];
  session: GameSession | null;
  teams: SessionTeam[];
  unassignedPlayers: SessionPlayer[];
  setError: Dispatch<SetStateAction<string>>;
  setOverridePrompt: Dispatch<
    SetStateAction<
      | { kind: "start" }
      | { kind: "round"; round: number; forceBreak?: boolean }
      | null
    >
  >;
  setBusy: SetHostBusy;
  setNotice: Dispatch<SetStateAction<string>>;
  setSession: Dispatch<SetStateAction<GameSession | null>>;
  sessionId: string;
  setAutoplayOverridden: Dispatch<SetStateAction<boolean>>;
  mainRounds: SessionChallenge[];
  saveSharedTimer: (
    roundNumber: number,
    remainingSeconds: number,
    isRunning: boolean,
    isOnBreak: boolean,
    resumeRoundNumber?: number | null,
  ) => Promise<boolean>;
  load: () => Promise<void>;
  busy: boolean;
  activeRewardRound: import("./types").SessionRewardRound | null;
  hostBreakActive: boolean;
  plannedBreakAfter: (roundNumber: number) => number;
  startScheduledBreak: (
    nextRound: number,
    minutes: number,
    confirmedOverride?: boolean,
  ) => Promise<void>;
  setHostBreakActive: Dispatch<SetStateAction<boolean>>;
  setBreakResumeRound: Dispatch<SetStateAction<number | null>>;
  breakAdvanceRequested: RefObject<boolean>;
}
export function useHostSessionActions({
  autoplayEnabled,
  players,
  session,
  teams,
  unassignedPlayers,
  setError,
  setOverridePrompt,
  setBusy,
  setNotice,
  setSession,
  sessionId,
  setAutoplayOverridden,
  mainRounds,
  saveSharedTimer,
  load,
  busy,
  activeRewardRound,
  hostBreakActive,
  plannedBreakAfter,
  startScheduledBreak,
  setHostBreakActive,
  setBreakResumeRound,
  breakAdvanceRequested,
}: Options) {
  function startOverrideReasons() {
    const reasons: string[] = [];
    if (autoplayEnabled) reasons.push("You are taking control from autoplay.");
    if (players.length === 0) reasons.push("No players have joined yet.");
    if (session?.teams_enabled && teams.length === 0)
      reasons.push("No teams have been created.");
    if (session?.teams_enabled && unassignedPlayers.length > 0)
      reasons.push(
        `${unassignedPlayers.length} player${unassignedPlayers.length === 1 ? " is" : "s are"} not assigned to a team.`,
      );
    if (session?.host_participates && !session.host_player_id)
      reasons.push(
        "You selected host participation but have not joined as a player.",
      );
    return reasons;
  }

  async function startGame(confirmedOverride = false) {
    if (!session) return;
    if (players.length === 0) {
      setError("At least one player must join before you can start the game.");
      return;
    }
    if (
      session.teams_enabled &&
      (teams.length === 0 || unassignedPlayers.length > 0)
    ) {
      setError(
        "Every player must be assigned to a team before you can start. Assign the remaining players, then try again.",
      );
      return;
    }
    if (!confirmedOverride && startOverrideReasons().length > 0) {
      setOverridePrompt({ kind: "start" });
      return;
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    if (
      session.host_participates &&
      !session.host_player_id &&
      confirmedOverride
    ) {
      const { error: participationError } =
        await hostRosterCommands.disableHostParticipation(
          { host_participates: false },
          session.id,
        );
      if (participationError) {
        setBusy(false);
        setError(participationError.message);
        return;
      }
      setSession({ ...session, host_participates: false });
    }
    const { error: startError } =
      await hostSessionCommands.hostStartGameSession({
        p_session_id: session.id,
      });
    setBusy(false);
    if (startError) {
      setError(startError.message);
      return;
    }
    if (autoplayEnabled && confirmedOverride) {
      localStorage.setItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
        "1",
      );
      setAutoplayOverridden(true);
    }
    const firstRound =
      mainRounds.find((round) => round.round_number === 1) ?? mainRounds[0];
    if (firstRound) {
      const key = `chaos-crawl-host-round-clock:${session.id}:${firstRound.round_number}`;
      const seconds =
        Math.max(0, Number(firstRound.duration_minutes) || 0) * 60;
      localStorage.setItem(
        key,
        JSON.stringify({
          seconds,
          running: false,
          onBreak: false,
          updatedAt: Date.now(),
        }),
      );
      await saveSharedTimer(
        Number(firstRound.round_number ?? 1),
        seconds,
        false,
        false,
      );
    }
    setNotice(
      confirmedOverride
        ? "Game started with host control. Round 1 is ready; start its timer when everyone is set."
        : "Game started. Players will see Round 1.",
    );
    await load();
  }

  async function moveToRound(
    nextRound: number,
    confirmedOverride = false,
    forceBreakMinutes = 0,
  ) {
    if (!session || busy) return;
    if (activeRewardRound) {
      setError(
        "Complete or cancel the reward flow before moving to another round.",
      );
      return;
    }
    if (!hostBreakActive && nextRound > session.current_round_number) {
      const breakMinutes =
        forceBreakMinutes || plannedBreakAfter(session.current_round_number);
      if (breakMinutes > 0) {
        await startScheduledBreak(nextRound, breakMinutes, confirmedOverride);
        return;
      }
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: roundError } =
      await hostSessionCommands.hostSetGameSessionRound({
        p_session_id: session.id,
        p_round_number: nextRound,
      });
    setBusy(false);
    if (roundError) {
      setError(roundError.message);
      return;
    }
    if (confirmedOverride && autoplayEnabled) {
      localStorage.setItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
        "1",
      );
      setAutoplayOverridden(true);
    }
    const targetRound = mainRounds.find(
      (round) => round.round_number === nextRound,
    );
    const clockKey = `chaos-crawl-host-round-clock:${session.id}:${nextRound}`;
    localStorage.setItem(
      clockKey,
      JSON.stringify({
        seconds: Math.max(0, Number(targetRound?.duration_minutes) || 0) * 60,
        running: false,
        onBreak: false,
        updatedAt: Date.now(),
      }),
    );
    await saveSharedTimer(
      nextRound,
      Math.max(0, Number(targetRound?.duration_minutes) || 0) * 60,
      false,
      false,
      null,
    );
    setHostBreakActive(false);
    setBreakResumeRound(null);
    breakAdvanceRequested.current = false;
    setNotice(
      `Round ${nextRound} is ready. Announce the challenge, then start its timer when everyone is set. Later timings will follow from this change.`,
    );
    await load();
  }

  async function finishGame() {
    if (!session) return;
    if (activeRewardRound) {
      setError(
        "Complete or cancel the reward flow and return everyone to the game before finishing.",
      );
      return;
    }
    if (
      !window.confirm(
        "Finish this game? Players will no longer be able to submit challenges.",
      )
    )
      return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: finishError } =
      await hostSessionCommands.hostCompleteGameSession({
        p_session_id: session.id,
      });
    setBusy(false);
    if (finishError) {
      setError(finishError.message);
      return;
    }
    setNotice("Game completed.");
    await load();
  }
  return { startOverrideReasons, startGame, moveToRound, finishGame };
}
