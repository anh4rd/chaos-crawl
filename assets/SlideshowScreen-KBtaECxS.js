var e=`import type { ReactNode } from "react";
import IconButton from "../ui/IconButton";
import CountBadge from "../ui/CountBadge";
import Note from "../ui/Note";

export default function SlideshowScreen({
  as: Element = "main",
  live = false,
  variant,
  counter,
  onFullscreen,
  error,
  children,
}: {
  as?: "main" | "div";
  live?: boolean;
  variant?: "playback" | "playback-empty" | "playback-loading";
  counter?: { index: number; total: number };
  onFullscreen?: () => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <Element
      className={\`slideshow-screen\${variant ? \` slideshow-screen--\${variant}\` : ""}\`}
      aria-live={live ? "polite" : undefined}
    >
      {children}
      {counter && (
        <CountBadge variant="slideshow">
          {counter.index + 1} / {counter.total}
        </CountBadge>
      )}
      {onFullscreen && (
        <IconButton
          variant="slideshow-fullscreen"
          type="button"
          onClick={onFullscreen}
          label="Enter fullscreen"
          icon="expand"
        />
      )}
      {error && (
        <Note variant="slideshow-feedback" role="status">
          {error}
        </Note>
      )}
    </Element>
  );
}
`;export{e as default};