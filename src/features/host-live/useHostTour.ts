import { useCallback, useEffect, useState } from "react";
import type { GuidedTourStep } from "../../components/tour/GuidedTour";
import { hostTourSteps } from "./hostTourSteps";
import type { HostTab, SessionStatus } from "./types";

export function useHostTour({
  status,
  onTab,
  onLobbyStep,
}: {
  status?: SessionStatus;
  onTab: (tab: HostTab) => void;
  onLobbyStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
}) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<GuidedTourStep[]>([]);
  // A different session phase changes which tour targets exist.
  useEffect(() => {
    setOpen(false);
  }, [status]);
  const start = useCallback(() => {
    if (!status) return;
    setSteps(hostTourSteps(status));
    setOpen(true);
  }, [status]);
  const close = useCallback(() => setOpen(false), []);
  const navigate = useCallback(
    (page: string) => {
      switch (page) {
        case "invite":
          onLobbyStep(1);
          return;
        case "participation":
          onLobbyStep(2);
          return;
        case "roster":
          onLobbyStep(3);
          return;
        case "teams":
          onLobbyStep(4);
          return;
        case "team-names":
          onLobbyStep(5);
          return;
        case "ready":
          onLobbyStep(6);
          return;
        case "game":
        case "leaderboard":
        case "side-challenges":
        case "host-controls":
        case "reward-round":
        case "final-round":
          onTab(page);
      }
    },
    [onTab, onLobbyStep],
  );
  return { open, steps, start, close, navigate };
}
