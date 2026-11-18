import { useCallback, useState } from "react";

interface Options {
  sessionId: string;
}
export function useHostLobbyFlow({ sessionId }: Options) {
  const [lobbyStep, setLobbyStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(() => {
    const saved = Number(
      localStorage.getItem(`chaos-crawl-host-flow:${sessionId}`),
    );
    return saved === 1 ||
      saved === 2 ||
      saved === 3 ||
      saved === 4 ||
      saved === 5 ||
      saved === 6
      ? saved
      : 1;
  });

  const goToLobbyStep = useCallback(
    (step: 1 | 2 | 3 | 4 | 5 | 6) => {
      setLobbyStep(step);
      localStorage.setItem(`chaos-crawl-host-flow:${sessionId}`, String(step));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [sessionId],
  );
  return { lobbyStep, goToLobbyStep };
}
