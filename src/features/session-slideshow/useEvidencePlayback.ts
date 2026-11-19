import { useCallback, useEffect, useState } from "react";

export function useEvidencePlayback({
  open,
  currentIndex,
  itemId,
  mediaType,
  itemCount,
  advance,
}: {
  open: boolean;
  currentIndex: number;
  itemId: string | undefined;
  mediaType: "image" | "video" | undefined;
  itemCount: number;
  advance: (count: number) => void;
}) {
  const [mediaError, setMediaError] = useState("");
  useEffect(() => setMediaError(""), [itemId]);
  const next = useCallback(() => advance(itemCount), [advance, itemCount]);
  useEffect(() => {
    if (!open || itemCount < 2 || itemId === undefined) return;
    const timer = window.setTimeout(
      next,
      mediaType === "video" ? 15_000 : 6_000,
    );
    return () => window.clearTimeout(timer);
  }, [open, currentIndex, itemId, mediaType, itemCount, next]);
  return { mediaError, setMediaError, next };
}
