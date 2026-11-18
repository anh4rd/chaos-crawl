import type { ReactNode } from "react";
import Icon from "../ui/Icon";

export default function SlideshowScreen({
  as: Element = "main",
  live = false,
  counter,
  onFullscreen,
  error,
  children,
}: {
  as?: "main" | "div";
  live?: boolean;
  counter?: { index: number; total: number };
  onFullscreen?: () => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <Element className="cc-final-tv" aria-live={live ? "polite" : undefined}>
      {children}
      {counter && (
        <span className="cc-final-tv-counter">
          {counter.index + 1} / {counter.total}
        </span>
      )}
      {onFullscreen && (
        <button
          className="cc-final-tv-fullscreen"
          type="button"
          onClick={onFullscreen}
          aria-label="Enter fullscreen"
        >
          <Icon name="expand" className="icon--size-18" />
        </button>
      )}
      {error && (
        <p className="cc-final-tv-live-error" role="status">
          {error}
        </p>
      )}
    </Element>
  );
}
