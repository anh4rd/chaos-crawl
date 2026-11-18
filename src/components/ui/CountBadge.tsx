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
    | "moderation";
}) {
  return (
    <Container
      {...props}
      className={`count-badge${variant ? ` count-badge--${variant}` : ""} ${className}`.trim()}
    />
  );
}
