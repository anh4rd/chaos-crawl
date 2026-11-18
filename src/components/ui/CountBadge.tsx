import type { HTMLAttributes } from "react";
export default function CountBadge({
  as: Container = "span",
  className = "",
  variant,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "span" | "div";
  variant?:
    | "playback"
    | "slideshow"
    | "session"
    | "round-index"
    | "round-index-current"
    | "choice"
    | "filter"
    | "tab"
    | "moderation"
    | "console"
    | "console-rank"
    | "console-rank-first";
}) {
  return (
    <Container
      {...props}
      className={`count-badge${variant === "console-rank-first" ? " count-badge--console-rank count-badge--first" : ""}${variant ? ` count-badge--${variant}` : ""} ${className}`.trim()}
    />
  );
}
