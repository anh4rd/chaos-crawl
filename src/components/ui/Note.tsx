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
    | "lobby"
    | "control"
    | "session"
    | "access-intro"
    | "access-help"
    | "collection-loading";
  as?: "p" | "output" | "small" | "div";
}) {
  return (
    <Element
      {...props}
      className={`note${Element === "small" ? " note--inline" : ""}${compact ? " note--compact" : ""}${variant ? ` note--${variant}` : ""} ${className}`.trim()}
    />
  );
}
