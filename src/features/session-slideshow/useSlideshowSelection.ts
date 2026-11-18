import { useCallback, useState } from "react";
import type { SessionSlideshowView } from "../../types/sessionSlideshow";

export function useSlideshowSelection<View extends SessionSlideshowView>() {
  const [selection, setSelection] = useState<{
    view: View | null;
    currentIndex: number;
    hostEvidenceId: string | null;
  }>({ view: null, currentIndex: 0, hostEvidenceId: null });
  const applyView = useCallback((view: View | null) => {
    setSelection((previous) => {
      if (!view) return previous.view ? { ...previous, view: null } : previous;
      let currentIndex = Math.min(
        previous.currentIndex,
        Math.max(0, view.items.length - 1),
      );
      if (view.evidence_id !== previous.hostEvidenceId) {
        const selected = view.items.findIndex(
          (item) => item.id === view.evidence_id,
        );
        currentIndex = selected >= 0 ? selected : 0;
      }
      return { view, currentIndex, hostEvidenceId: view.evidence_id };
    });
  }, []);
  const advance = useCallback((itemCount: number) => {
    setSelection((previous) => ({
      ...previous,
      currentIndex: (previous.currentIndex + 1) % itemCount,
    }));
  }, []);
  return {
    view: selection.view,
    currentIndex: selection.currentIndex,
    applyView,
    advance,
  };
}
