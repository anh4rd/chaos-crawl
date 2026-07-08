import {
  useEffect,
  useState,
} from "react";

interface ScheduledCountdownProps {
  targetTime:
    string
    | null
    | undefined;
}

function getRemainingMs(
  targetTime:
    string
    | null
    | undefined
) {
  if (!targetTime) {
    return 0;
  }

  const target =
    new Date(
      targetTime
    ).getTime();

  if (
    Number.isNaN(target)
  ) {
    return 0;
  }

  return Math.max(
    0,
    target - Date.now()
  );
}

function formatCountdown(
  remainingMs: number
) {
  const totalSeconds =
    Math.ceil(
      remainingMs / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) / 60
    );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      minutes,
      seconds,
    ]
      .map((value) =>
        String(value)
          .padStart(
            2,
            "0"
          )
      )
      .join(":");
  }

  return [
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value)
        .padStart(
          2,
          "0"
        )
    )
    .join(":");
}

export default function ScheduledCountdown({
  targetTime,
}: ScheduledCountdownProps) {
  const [
    remainingMs,
    setRemainingMs,
  ] = useState(
    () =>
      getRemainingMs(
        targetTime
      )
  );

  useEffect(() => {
    const update =
      () => {
        setRemainingMs(
          getRemainingMs(
            targetTime
          )
        );
      };

    update();

    if (!targetTime) {
      return;
    }

    const intervalId =
      window.setInterval(
        update,
        1000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    targetTime,
  ]);

  if (!targetTime) {
    return null;
  }

  return (
    <span className="tabular-nums">
      {formatCountdown(
        remainingMs
      )}
    </span>
  );
}