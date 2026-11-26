var e=`import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function Badge({
  children,
  as: Container = "span",
  variant = "eyebrow",
  icon,
  className = "",
}: {
  children: ReactNode;
  as?: "span" | "div";
  variant?:
    | "playback"
    | "eyebrow"
    | "sticker"
    | "metadata"
    | "outline"
    | "subtle"
    | "dialog"
    | "round"
    | "vote"
    | "stage"
    | "stage-break"
    | "reveal"
    | "moderation-type"
    | "tag"
    | "entity"
    | "idea"
    | "idea-main"
    | "idea-side"
    | "idea-secret"
    | "idea-location"
    | "idea-route"
    | "console-live"
    | "console-scheduled"
    | "console-points"
    | "console-team"
    | "round-live"
    | "round-passed"
    | "round-next"
    | "completion"
    | "team-name";
  icon?: IconName;
  className?: string;
}) {
  return (
    <Container
      className={\`badge\${variant === "console-live" || variant === "console-scheduled" ? " badge--console-status" : ""}\${variant.startsWith("idea-") ? " badge--idea" : ""} badge--\${variant} \${className}\`.trim()}
    >
      {icon && <Icon name={icon} className="icon--size-17" />}
      {children}
    </Container>
  );
}
`;export{e as default};