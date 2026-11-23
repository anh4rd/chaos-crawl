import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { adjustSessionScore } from "../../lib/hostScoreCommands";
import type { SetHostBusy } from "./useHostOperation";

export function useHostScoreAdjustments({
  sessionId,
  setBusy,
  setError,
  setNotice,
  load,
}: {
  sessionId: string;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
}) {
  const mounted = useRef(false);
  const [scoreAdjustmentCount, setScoreAdjustmentCount] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function adjustScore(
    target: "player" | "team",
    id: string,
    delta: number,
  ) {
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    try {
      const { error } = await adjustSessionScore({
        p_session_id: sessionId,
        p_target_kind: target,
        p_target_id: id,
        p_delta: delta,
      });
      if (!mounted.current) return;
      if (error) {
        setError(`Couldn't adjust score: ${error.message}`);
        return;
      }
      setNotice("Score updated.");
      setScoreAdjustmentCount((count) => count + 1);
      await load();
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return { adjustScore, scoreAdjustmentCount };
}
