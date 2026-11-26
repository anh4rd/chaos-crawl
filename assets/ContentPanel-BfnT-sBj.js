var e=`import type { HTMLAttributes } from "react";
export default function ContentPanel({
  variant = "section",
  as: Container = "section",
  className = "",
  stacked = false,
  overlay = false,
  compact = false,
  state,
  ...props
}: HTMLAttributes<HTMLElement> & {
  variant?:
    | "private-feed"
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
    | "choice"
    | "access-field"
    | "entity"
    | "workspace-error"
    | "moderation"
    | "history"
    | "moderation-item"
    | "table"
    | "notice"
    | "record"
    | "console-white"
    | "console-tint"
    | "console-card"
    | "workspace-preview"
    | "account"
    | "ledger"
    | "scheduled"
    | "ranking"
    | "round"
    | "challenge";
  state?: "live" | "past" | "upcoming" | "complete";
  stacked?: boolean;
  overlay?: boolean;
  compact?: boolean;
  as?: "section" | "main" | "div" | "article";
}) {
  return (
    <Container
      {...props}
      className={\`content-panel\${variant === "console-white" || variant === "console-tint" ? " content-panel--console" : ""} content-panel--\${variant}\${state ? \` content-panel--\${state}\` : ""}\${overlay ? " content-panel--overlay" : ""}\${stacked ? " content-panel--stacked" : ""}\${compact ? " content-panel--compact" : ""} \${className}\`.trim()}
    />
  );
}
`;export{e as default};