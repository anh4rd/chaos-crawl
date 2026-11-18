import type { ReactNode } from "react";
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
    | "tag"
    | "entity"
    | "idea"
    | "idea-main"
    | "idea-side"
    | "idea-secret"
    | "idea-location"
    | "idea-route";
  icon?: IconName;
  className?: string;
}) {
  return (
    <Container
      className={`badge${variant.startsWith("idea-") ? " badge--idea" : ""} badge--${variant} ${className}`.trim()}
    >
      {icon && <Icon name={icon} className="icon--size-17" />}
      {children}
    </Container>
  );
}
