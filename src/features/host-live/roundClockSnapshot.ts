interface RoundClockSnapshot {
  seconds: number;
  running: boolean;
  onBreak: boolean;
  resumeRound: number | null;
}
interface SavedRoundClock extends RoundClockSnapshot {
  updatedAt?: number;
}
export function readRoundClockSnapshot(
  value: string | null,
): SavedRoundClock | null {
  const saved: unknown = JSON.parse(value ?? "null");
  if (
    !saved ||
    typeof saved !== "object" ||
    !("seconds" in saved) ||
    typeof saved.seconds !== "number" ||
    !Number.isFinite(saved.seconds)
  )
    return null;
  const onBreak = "onBreak" in saved && Boolean(saved.onBreak);
  const resumeRound = "resumeRound" in saved ? saved.resumeRound : null;
  if (
    resumeRound != null &&
    (typeof resumeRound !== "number" ||
      !Number.isInteger(resumeRound) ||
      resumeRound <= 0)
  )
    return null;
  if (onBreak && resumeRound == null) return null;
  return {
    seconds: saved.seconds,
    running: "running" in saved && Boolean(saved.running),
    onBreak,
    resumeRound: resumeRound ?? null,
    ...("updatedAt" in saved &&
    typeof saved.updatedAt === "number" &&
    Number.isFinite(saved.updatedAt)
      ? { updatedAt: saved.updatedAt }
      : {}),
  };
}
export function writeRoundClockSnapshot(
  key: string,
  snapshot: RoundClockSnapshot,
) {
  localStorage.setItem(
    key,
    JSON.stringify({ ...snapshot, updatedAt: Date.now() }),
  );
}
