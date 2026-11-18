import type { HTMLAttributes } from "react";

export default function Note({
  compact = false,
  variant,
  as: Element = "p",
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  compact?: boolean;
  variant?:
    | "playback-loading"
    | "playback-waiting"
    | "playback-notice"
    | "media-unavailable"
    | "slideshow-copy"
    | "slideshow-error"
    | "slideshow-feedback"
    | "lobby"
    | "control"
    | "session"
    | "access-intro"
    | "access-help"
    | "collection-loading"
    | "inverse"
    | "record";
  as?: "p" | "output" | "small" | "div" | "span";
}) {
  return (
    <Element
      {...props}
      className={`note${Element === "small" ? " note--inline" : ""}${compact ? " note--compact" : ""}${variant ? ` note--${variant}` : ""} ${className}`.trim()}
    />
  );
}
