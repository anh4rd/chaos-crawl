import type { HTMLAttributes } from "react";
export default function CountBadge({
  className = "",
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "session" | "round-index" | "round-index-current" | "choice";
}) {
  return (
    <span
      {...props}
      className={`count-badge${variant ? ` count-badge--${variant}` : ""} ${className}`.trim()}
    />
  );
}
