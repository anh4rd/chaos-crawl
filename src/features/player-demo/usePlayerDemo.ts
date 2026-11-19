import { useCallback, useState } from "react";
import type { PlayerDemoModel, PlayerDemoPage } from "./types";

export function usePlayerDemo(): PlayerDemoModel {
  const [page, setPage] = useState<PlayerDemoPage>("game");
  const [tourOpen, setTourOpen] = useState(true);
  const [sampleUpload, setSampleUpload] = useState(false);
  const onNavigateTour = useCallback((next: string) => {
    if (
      next === "game" ||
      next === "leaderboard" ||
      next === "side-challenges" ||
      next === "final"
    )
      setPage(next);
  }, []);
  return {
    page,
    tourOpen,
    sampleUpload,
    onSelectPage: setPage,
    onNavigateTour,
    onRestartTour: () => setTourOpen(true),
    onCloseTour: () => setTourOpen(false),
    onSampleAction: () => setSampleUpload(true),
  };
}
