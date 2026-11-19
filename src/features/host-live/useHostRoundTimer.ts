import type { PlannedTaskInfo } from "../../types/hostSession";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import type { GameScheduleItem, GameSession, SessionChallenge } from "./types";
import type { SetHostBusy } from "./useHostOperation";
import {
  readRoundClockSnapshot,
  writeRoundClockSnapshot,
} from "./roundClockSnapshot";

interface Options {
  mainRounds: SessionChallenge[];
  session: GameSession | null;
  plannedTasks: PlannedTaskInfo[];
  gameSchedule: GameScheduleItem[];
  defaultBreakMinutes: number;
  currentChallenge: SessionChallenge | undefined;
  busy: boolean;
  setNotice: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string>>;
  setBusy: SetHostBusy;
  openPointReview: () => void;
}
export function useHostRoundTimer({
  mainRounds,
  session,
  plannedTasks,
  gameSchedule,
  defaultBreakMinutes,
  currentChallenge,
  busy,
  setNotice,
  setError,
  setBusy,
  openPointReview,
}: Options) {
  const [hostBreakActive, setHostBreakActive] = useState(false);

  const [roundClockSeconds, setRoundClockSeconds] = useState(0);

  const [roundClockRunning, setRoundClockRunning] = useState(false);

  const [hydratedRoundClockKey, setHydratedRoundClockKey] = useState("");

  const [editingBreakTimer, setEditingBreakTimer] = useState(false);

  const [editBreakMinutes, setEditBreakMinutes] = useState(15);

  const [breakResumeRound, setBreakResumeRound] = useState<number | null>(null);

  const roundClockSecondsRef = useRef(roundClockSeconds);

  roundClockSecondsRef.current = roundClockSeconds;

  const sharedTimerWriteQueue = useRef<Promise<void>>(Promise.resolve());

  const nextBreakChallenge = mainRounds.find(
    (item) =>
      item.round_number ===
      (breakResumeRound ?? (session?.current_round_number ?? 0) + 1),
  );

  const nextBreakTask = nextBreakChallenge
    ? (plannedTasks.find((task) =>
        gameSchedule.some(
          (item) =>
            item.type === "challenge" &&
            item.taskId === task.id &&
            (item.title === nextBreakChallenge.title ||
              item.title.startsWith(task.title ?? "")),
        ),
      ) ??
      plannedTasks.find(
        (task) =>
          (task.title ?? "").toLowerCase() ===
          nextBreakChallenge.title.toLowerCase(),
      ))
    : undefined;

  const breakStartAt =
    hostBreakActive && roundClockRunning
      ? new Date(Date.now() + roundClockSeconds * 1000)
      : null;

  const nextRoundStartAt = breakStartAt
    ? new Date(breakStartAt.getTime())
    : null;

  const nextRoundEndAt =
    nextRoundStartAt && nextBreakChallenge
      ? new Date(
          nextRoundStartAt.getTime() +
            Math.max(0, Number(nextBreakChallenge.duration_minutes) || 0) *
              60_000,
        )
      : null;

  function plannedBreakAfter(roundNumber: number) {
    if (roundNumber >= mainRounds.length) return 0;
    const currentRound = mainRounds.find(
      (round) => Number(round.round_number) === roundNumber,
    );
    if (!currentRound) return defaultBreakMinutes;
    const normalize = (title: string) =>
      title
        .toLowerCase()
        .replace(/\s*[-–—]\s*(player prep|player performance)$/i, "")
        .trim();
    const currentTitle = normalize(currentRound.title);
    let scheduleIndex = gameSchedule.findIndex(
      (item) =>
        item.type === "challenge" && normalize(item.title) === currentTitle,
    );
    if (scheduleIndex < 0)
      scheduleIndex = gameSchedule.findIndex(
        (item) =>
          item.type === "challenge" &&
          (normalize(item.title).startsWith(currentTitle) ||
            currentTitle.startsWith(normalize(item.title))),
      );
    if (scheduleIndex >= 0) {
      let planned = 0;
      for (
        let index = scheduleIndex + 1;
        index < gameSchedule.length;
        index += 1
      ) {
        const item = gameSchedule[index];
        if (item.type === "challenge") break;
        if (item.type === "break")
          planned += Math.max(0, Number(item.duration) || 0);
      }
      if (planned > 0) return planned;
    }
    return defaultBreakMinutes;
  }

  const upcomingBreakMinutes =
    session && session.status === "live"
      ? plannedBreakAfter(session.current_round_number)
      : 0;

  const roundClockKey =
    session?.id && session.status === "live"
      ? `${session.id}:${session.current_round_number}`
      : "";

  const roundClockStorageKey = roundClockKey
    ? `chaos-crawl-host-round-clock:${roundClockKey}`
    : "";

  const roundClockText = `${Math.floor(roundClockSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(roundClockSeconds % 60).toString().padStart(2, "0")}`;

  const roundTimerHydrated = Boolean(
    roundClockKey && hydratedRoundClockKey === roundClockKey,
  );

  useEffect(() => {
    if (!roundClockStorageKey || !currentChallenge) return;
    let seconds =
      Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    let running = false;
    let onBreak = false;
    let resumeRound: number | null = null;
    try {
      const saved = readRoundClockSnapshot(
        localStorage.getItem(roundClockStorageKey),
      );
      if (saved && Number.isFinite(saved.seconds)) {
        seconds = Math.max(0, Number(saved.seconds));
        running = Boolean(saved.running);
        onBreak = Boolean(saved.onBreak);
        resumeRound = saved.resumeRound ?? null;
        if (running && Number.isFinite(saved.updatedAt))
          seconds = Math.max(
            0,
            seconds - Math.floor((Date.now() - Number(saved.updatedAt)) / 1000),
          );
      }
    } catch {
      /* Start a fresh host-side clock if browser storage is unavailable. */
    }
    setRoundClockSeconds(seconds);
    setRoundClockRunning(running && seconds > 0);
    setHostBreakActive(onBreak);
    setBreakResumeRound(resumeRound);
    setHydratedRoundClockKey(roundClockKey);
    void saveSharedTimer(
      Number(
        currentChallenge.round_number ?? session?.current_round_number ?? 1,
      ),
      seconds,
      running && seconds > 0,
      onBreak,
      resumeRound,
    );
  }, [roundClockKey, roundClockStorageKey, currentChallenge?.duration_minutes]);

  useEffect(() => {
    if (!roundClockRunning || !roundClockKey) return;
    const interval = window.setInterval(
      () => setRoundClockSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [roundClockKey, roundClockRunning]);

  useEffect(() => {
    if (!roundClockRunning || !session || !roundClockKey) return;
    const interval = window.setInterval(() => {
      void saveSharedTimer(
        session.current_round_number,
        roundClockSecondsRef.current,
        true,
        hostBreakActive,
        breakResumeRound,
      );
    }, 5000);
    return () => window.clearInterval(interval);
  }, [
    breakResumeRound,
    hostBreakActive,
    roundClockKey,
    roundClockRunning,
    session?.current_round_number,
  ]);

  useEffect(() => {
    if (roundClockRunning && roundClockSeconds === 0)
      setRoundClockRunning(false);
  }, [roundClockRunning, roundClockSeconds]);

  useEffect(() => {
    if (
      !session ||
      !roundTimerHydrated ||
      !roundClockKey ||
      hostBreakActive ||
      roundClockRunning ||
      roundClockSeconds !== 0
    )
      return;
    void saveSharedTimer(session.current_round_number, 0, false, false);
  }, [
    hostBreakActive,
    roundClockKey,
    roundClockRunning,
    roundClockSeconds,
    roundTimerHydrated,
    session?.current_round_number,
  ]);

  useEffect(() => {
    if (!roundClockStorageKey || hydratedRoundClockKey !== roundClockKey)
      return;
    try {
      writeRoundClockSnapshot(roundClockStorageKey, {
        seconds: roundClockSeconds,
        running: roundClockRunning,
        onBreak: hostBreakActive,
        resumeRound: breakResumeRound,
      });
    } catch {
      /* The timer continues for this visit without persistence. */
    }
  }, [
    breakResumeRound,
    hostBreakActive,
    hydratedRoundClockKey,
    roundClockKey,
    roundClockRunning,
    roundClockSeconds,
    roundClockStorageKey,
  ]);

  function toggleTimer() {
    if (!session || !currentChallenge) return;
    const nextRunning = !roundClockRunning;
    const seconds =
      roundClockSeconds > 0
        ? roundClockSeconds
        : hostBreakActive
          ? 0
          : Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    setRoundClockSeconds(seconds);
    setRoundClockRunning(nextRunning && seconds > 0);
    void saveSharedTimer(
      session.current_round_number,
      seconds,
      nextRunning && seconds > 0,
      hostBreakActive,
      breakResumeRound,
    );
    setNotice(
      nextRunning
        ? hostBreakActive
          ? "Break timer resumed. Players can see the updated resume time."
          : "Round timer started."
        : hostBreakActive
          ? "Break timer paused. Players will see that the break is paused."
          : "Round timer paused.",
    );
  }

  async function startScheduledBreak(nextRound: number, minutes: number) {
    if (!session || busy || minutes <= 0) return;
    const seconds = Math.round(minutes * 60);
    setHostBreakActive(true);
    setBreakResumeRound(nextRound);
    setRoundClockSeconds(seconds);
    setRoundClockRunning(true);
    setError("");
    setNotice("");
    if (roundClockStorageKey) {
      writeRoundClockSnapshot(roundClockStorageKey, {
        seconds,
        running: true,
        onBreak: true,
        resumeRound: nextRound,
      });
    }
    await saveSharedTimer(
      session.current_round_number,
      seconds,
      true,
      true,
      nextRound,
    );
  }

  function openBreakTimerEditor() {
    setEditBreakMinutes(Math.max(1, Math.ceil(roundClockSeconds / 60)));
    setEditingBreakTimer(true);
  }

  async function saveBreakTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !hostBreakActive || !breakResumeRound) return;
    const minutes = Number(editBreakMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      setError("Break duration must be between 1 and 240 minutes.");
      return;
    }
    const seconds = Math.round(minutes * 60);
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const saved = await saveSharedTimer(
      session.current_round_number,
      seconds,
      roundClockRunning,
      true,
      breakResumeRound,
    );
    setBusy(false);
    if (!saved) return;
    setRoundClockSeconds(seconds);
    if (roundClockStorageKey) {
      writeRoundClockSnapshot(roundClockStorageKey, {
        seconds,
        running: roundClockRunning,
        onBreak: true,
        resumeRound: breakResumeRound,
      });
    }
    setEditingBreakTimer(false);
    setNotice(
      `Break timer updated to ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }

  function skipTimerAndReview() {
    if (roundClockRunning && !hostBreakActive) toggleTimer();
    openPointReview();
  }

  function restartRoundTimer() {
    if (!session || !currentChallenge || hostBreakActive) return;
    const seconds =
      Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    const running = seconds > 0;
    setRoundClockSeconds(seconds);
    setRoundClockRunning(running);
    void saveSharedTimer(session.current_round_number, seconds, running, false);
    setNotice("Round timer restarted.");
  }

  function resetRoundTimer() {
    if (!session || !currentChallenge || hostBreakActive) return;
    const seconds =
      Math.max(0, Number(currentChallenge.duration_minutes) || 0) * 60;
    setRoundClockSeconds(seconds);
    setRoundClockRunning(false);
    if (roundClockStorageKey) {
      writeRoundClockSnapshot(roundClockStorageKey, {
        seconds,
        running: false,
        onBreak: false,
        resumeRound: null,
      });
    }
    void saveSharedTimer(session.current_round_number, seconds, false, false);
    setNotice("Round timer reset. Start it when you’re ready.");
  }

  async function saveSharedTimer(
    roundNumber: number,
    remainingSeconds: number,
    isRunning: boolean,
    isOnBreak: boolean,
    resumeRoundNumber: number | null = null,
  ): Promise<boolean> {
    if (!session) return false;
    const seconds = Math.max(0, Math.floor(remainingSeconds));
    const timerId = session.id;
    const write = sharedTimerWriteQueue.current.then(async () => {
      const { error: timerError } = await hostSessionCommands.writeSharedTimer({
        session_id: timerId,
        round_number: roundNumber,
        remaining_seconds: seconds,
        is_running: isRunning,
        is_on_break: isOnBreak,
        resume_round_number: isOnBreak ? resumeRoundNumber : null,
        break_ends_at:
          isOnBreak && isRunning
            ? new Date(Date.now() + seconds * 1000).toISOString()
            : null,
        updated_at: new Date().toISOString(),
      });
      if (timerError) {
        setError(
          `The host timer changed, but players could not receive the timer update: ${timerError.message}`,
        );
        return false;
      }
      return true;
    });
    sharedTimerWriteQueue.current = write.then(
      () => undefined,
      () => undefined,
    );
    return write;
  }

  async function initializeRoundClock(
    roundNumber: number,
    durationMinutes: number,
  ) {
    if (!session) return;
    const seconds = Math.max(0, Number(durationMinutes) || 0) * 60;
    writeRoundClockSnapshot(
      `chaos-crawl-host-round-clock:${session.id}:${roundNumber}`,
      {
        seconds,
        running: false,
        onBreak: false,
        resumeRound: null,
      },
    );
    await saveSharedTimer(roundNumber, seconds, false, false, null);
    setHostBreakActive(false);
    setBreakResumeRound(null);
  }

  return {
    hostBreakActive,
    roundClockSeconds,
    roundClockRunning,
    editingBreakTimer,
    setEditingBreakTimer,
    editBreakMinutes,
    setEditBreakMinutes,
    breakResumeRound,
    nextBreakChallenge,
    nextBreakTask,
    nextRoundStartAt,
    nextRoundEndAt,
    plannedBreakAfter,
    upcomingBreakMinutes,
    roundClockText,
    roundTimerHydrated,
    toggleTimer,
    initializeRoundClock,
    startScheduledBreak,
    openBreakTimerEditor,
    saveBreakTimer,
    skipTimerAndReview,
    restartRoundTimer,
    resetRoundTimer,
    saveSharedTimer,
  };
}
