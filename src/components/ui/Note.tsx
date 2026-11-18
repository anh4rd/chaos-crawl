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
    | "slideshow-copy"
    | "slideshow-error"
    | "slideshow-feedback"
    | "lobby"
    | "control"
    | "session"
    | "access-intro"
    | "access-help"
    | "collection-loading";
  as?: "p" | "output" | "small" | "div" | "span";
}) {
  return (
    <Element
      {...props}
      className={`note${Element === "small" ? " note--inline" : ""}${compact ? " note--compact" : ""}${variant ? ` note--${variant}` : ""} ${className}`.trim()}
    />
  );
}
