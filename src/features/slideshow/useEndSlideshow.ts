import { useEffect, useRef, useState } from "react";
import { updateGameState } from "../../lib/gameApi";

export function useEndSlideshow(isHost: boolean, onEnded: () => void) {
  const [ending, setEnding] = useState(false);
  const lifetime = useRef<{
    active: boolean;
    host: boolean;
    locked: boolean;
  } | null>(null);
  useEffect(() => {
    const current = { active: true, host: isHost, locked: false };
    lifetime.current = current;
    setEnding(false);
    return () => {
      current.active = false;
    };
  }, [isHost]);

  async function end() {
    const current = lifetime.current;
    if (!isHost || !current?.active || !current.host || current.locked) return;
    if (!window.confirm("End slideshow for everyone?")) return;
    current.locked = true;
    setEnding(true);
    const { error } = await updateGameState({ slideshow_open: false });
    if (!current.active || lifetime.current !== current) return;
    if (error) {
      current.locked = false;
      setEnding(false);
      window.alert(`Could not end slideshow: ${error.message}`);
      return;
    }
    onEnded();
  }

  return { ending, end };
}
