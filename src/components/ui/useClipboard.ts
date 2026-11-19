import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  text: string;
  resetAfterMs?: number;
}
type CopyOutcome = "copied" | "failed" | "obsolete";

export function useClipboard({ text, resetAfterMs }: Options) {
  const identity = useRef({ text, generation: 0 });
  if (identity.current.text !== text) {
    identity.current = { text, generation: identity.current.generation + 1 };
  }
  const mounted = useRef(false);
  const request = useRef(0);
  const resetTimer = useRef<number | null>(null);
  const [copied, setCopied] = useState<{
    generation: number;
    request: number;
  } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current += 1;
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);
  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    };
  }, [text]);

  const copy = useCallback(async (): Promise<CopyOutcome> => {
    if (!mounted.current || identity.current.text !== text) return "obsolete";
    const generation = identity.current.generation;
    const attempt = ++request.current;
    const isCurrent = () =>
      mounted.current &&
      generation === identity.current.generation &&
      attempt === request.current;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return isCurrent() ? "failed" : "obsolete";
    }
    if (!isCurrent()) return "obsolete";
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    setCopied({ generation, request: attempt });
    if (resetAfterMs !== undefined) {
      resetTimer.current = window.setTimeout(() => {
        if (!mounted.current || generation !== identity.current.generation)
          return;
        setCopied((current) =>
          current?.generation === generation && current.request === attempt
            ? null
            : current,
        );
      }, resetAfterMs);
    }
    return "copied";
  }, [text, resetAfterMs]);

  return { copied: copied?.generation === identity.current.generation, copy };
}
