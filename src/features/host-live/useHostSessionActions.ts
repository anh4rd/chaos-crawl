import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
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
  setBusy: SetHostBusy;
  setNotice: Dispatch<SetStateAction<string>>;
  setSession: Dispatch<SetStateAction<GameSession | null>>;
  sessionId: string;
  mainRounds: SessionChallenge[];
  initializeRoundClock: (
    roundNumber: number,
    durationMinutes: number,
  ) => Promise<void>;
  toggleTimer: () => void;
  roundClockSeconds: number;
  breakResumeRound: number | null;
  load: () => Promise<void>;
  busy: boolean;
  activeRewardRound: import("./types").SessionRewardRound | null;
  hostBreakActive: boolean;
  plannedBreakAfter: (roundNumber: number) => number;
  startScheduledBreak: (nextRound: number, minutes: number) => Promise<void>;
}
export function useHostSessionActions({
  autoplayEnabled,
  players,
  session,
  teams,
  unassignedPlayers,
  setError,
  setBusy,
  setNotice,
  setSession,
  sessionId,
  mainRounds,
  initializeRoundClock,
  toggleTimer,
  roundClockSeconds,
  breakResumeRound,
  load,
  busy,
  activeRewardRound,
  hostBreakActive,
  plannedBreakAfter,
  startScheduledBreak,
}: Options) {
  const [autoplayOverridden, setAutoplayOverridden] = useState(false);
  const [overridePrompt, setOverridePrompt] = useState<
    | null
    | { kind: "start" }
    | { kind: "round"; round: number; forceBreak?: boolean; direct?: boolean }
  >(null);
  const breakAdvance = useRef<"idle" | "pending" | "failed" | "succeeded">(
    "idle",
  );
  useEffect(() => {
    setAutoplayOverridden(
      localStorage.getItem(
        `chaos-crawl-host-autoplay-override:${sessionId}`,
      ) === "1",
    );
  }, [sessionId]);
  useEffect(() => {
    breakAdvance.current = "idle";
  }, [
    session?.id,
    session?.current_round_number,
    hostBreakActive,
    breakResumeRound,
  ]);
  useEffect(() => {
    if (
      session?.status !== "live" ||
      busy ||
      !hostBreakActive ||
      roundClockSeconds !== 0 ||
      !breakResumeRound ||
      breakAdvance.current !== "idle"
    )
      return;
    breakAdvance.current = "pending";
    void moveToRound(breakResumeRound).then((outcome) => {
      breakAdvance.current = outcome === "moved" ? "succeeded" : "failed";
    });
  }, [
    session?.id,
    session?.status,
    busy,
    hostBreakActive,
    roundClockSeconds,
    breakResumeRound,
  ]);

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
      await initializeRoundClock(
        Number(firstRound.round_number ?? 1),
        firstRound.duration_minutes ?? 0,
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
    direct = false,
  ): Promise<"moved" | "break-started" | "blocked" | "failed"> {
    if (!session || busy) return "blocked";
    if (activeRewardRound) {
      setError(
        "Complete or cancel the reward flow before moving to another round.",
      );
      return "blocked";
    }
    if (
      !direct &&
      !hostBreakActive &&
      nextRound > session.current_round_number
    ) {
      const breakMinutes =
        forceBreakMinutes || plannedBreakAfter(session.current_round_number);
      if (breakMinutes > 0) {
        await startScheduledBreak(nextRound, breakMinutes);
        if (confirmedOverride && autoplayEnabled) markAutoplayOverridden();
        const resumeAt = new Date(
          Date.now() + Math.round(breakMinutes * 60) * 1000,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setNotice(
          `Break started for ${breakMinutes} minutes. The next round is scheduled to resume at ${resumeAt}.`,
        );
        return "break-started";
      }
    }
    if (!setBusy(true)) return "blocked";
    setError("");
    setNotice("");
    try {
      const { error: roundError } =
        await hostSessionCommands.hostSetGameSessionRound({
          p_session_id: session.id,
          p_round_number: nextRound,
        });
      setBusy(false);
      if (roundError) {
        setError(roundError.message);
        return "failed";
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
      await initializeRoundClock(nextRound, targetRound?.duration_minutes ?? 0);
      breakAdvance.current = "succeeded";
      setNotice(
        `Round ${nextRound} is ready. Announce the challenge, then start its timer when everyone is set. Later timings will follow from this change.`,
      );
      await load();
      return "moved";
    } catch (error) {
      setBusy(false);
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't move to the next round. Try again.",
      );
      return "failed";
    }
  }

  async function finishGame() {
    if (!session) return false;
    if (activeRewardRound) {
      setError(
        "Complete or cancel the reward flow and return everyone to the game before finishing.",
      );
      return false;
    }
    if (
      !window.confirm(
        "Finish this game? Players will no longer be able to submit challenges.",
      )
    )
      return false;
    if (!setBusy(true)) return false;
    setError("");
    setNotice("");
    const { error: finishError } =
      await hostSessionCommands.hostCompleteGameSession({
        p_session_id: session.id,
      });
    setBusy(false);
    if (finishError) {
      setError(finishError.message);
      return false;
    }
    setNotice("Game completed.");
    await load();
    return true;
  }
  function markAutoplayOverridden() {
    localStorage.setItem(
      `chaos-crawl-host-autoplay-override:${sessionId}`,
      "1",
    );
    setAutoplayOverridden(true);
  }
  function startGameOrToggleTimer() {
    if (session?.status === "lobby") void startGame();
    else toggleTimer();
  }
  function requestMoveToRound(nextRound: number, direct = false) {
    if (autoplayEnabled && !autoplayOverridden) {
      setOverridePrompt({
        kind: "round",
        round: nextRound,
        ...(direct ? { direct: true } : {}),
      });
      return;
    }
    void moveToRound(nextRound, false, 0, direct);
  }
  function requestStartBreak() {
    if (
      !session ||
      session.status !== "live" ||
      session.current_round_number >= mainRounds.length
    )
      return;
    const nextRound = session.current_round_number + 1;
    if (autoplayEnabled && !autoplayOverridden) {
      setOverridePrompt({ kind: "round", round: nextRound, forceBreak: true });
      return;
    }
    void moveToRound(
      nextRound,
      false,
      plannedBreakAfter(session.current_round_number) || 15,
    );
  }
  function confirmHostOverride() {
    const prompt = overridePrompt;
    setOverridePrompt(null);
    if (prompt?.kind === "start") void startGame(true);
    if (prompt?.kind === "round")
      void moveToRound(
        prompt.round,
        true,
        prompt.forceBreak
          ? plannedBreakAfter(session?.current_round_number ?? 0) || 15
          : 0,
        prompt.direct,
      );
  }
  return {
    startOverrideReasons,
    startGame,
    moveToRound,
    finishGame,
    overridePrompt,
    setOverridePrompt,
    startGameOrToggleTimer,
    requestMoveToRound,
    requestStartBreak,
    confirmHostOverride,
  };
}
