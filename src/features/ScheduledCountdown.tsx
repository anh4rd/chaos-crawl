import { useEffect, useState } from "react";

interface ScheduledCountdownProps {
  targetTime: string | null | undefined;
}

function getRemainingMs(targetTime: string | null | undefined) {
  if (!targetTime) {
    return 0;
  }

  const target = new Date(targetTime).getTime();

  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.max(0, target - Date.now());
}

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.ceil(remainingMs / MILLISECONDS_PER_SECOND);

  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);

  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );

  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function ScheduledCountdown({
  targetTime,
}: ScheduledCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getRemainingMs(targetTime),
  );

  useEffect(() => {
    const update = () => {
      setRemainingMs(getRemainingMs(targetTime));
    };

    update();

    if (!targetTime) {
      return;
    }

    const intervalId = window.setInterval(update, MILLISECONDS_PER_SECOND);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTime]);

  if (!targetTime) {
    return null;
  }

  return (
    <span className="scheduled-countdown">{formatCountdown(remainingMs)}</span>
  );
}
