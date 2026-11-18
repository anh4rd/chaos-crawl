import type { HTMLAttributes } from "react";
export default function CountBadge({
  className = "",
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?:
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
    <span
      {...props}
      className={`count-badge${variant ? ` count-badge--${variant}` : ""} ${className}`.trim()}
    />
  );
}
