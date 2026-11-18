import type { HTMLAttributes } from "react";
export default function ContentPanel({
  variant = "section",
  as: Container = "section",
  className = "",
  stacked = false,
  overlay = false,
  compact = false,
  ...props
}: HTMLAttributes<HTMLElement> & {
  variant?:
    | "section"
    | "library"
    | "selection"
    | "form"
    | "workspace"
    | "lobby"
    | "controls"
    | "session"
    | "review-controls"
    | "review-result"
    | "choice";
  stacked?: boolean;
  overlay?: boolean;
  compact?: boolean;
  as?: "section" | "main" | "div";
}) {
  return (
    <Container
      {...props}
      className={`content-panel content-panel--${variant}${overlay ? " content-panel--overlay" : ""}${stacked ? " content-panel--stacked" : ""}${compact ? " content-panel--compact" : ""} ${className}`.trim()}
    />
  );
}
