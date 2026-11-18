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
    | "entity";
  icon?: IconName;
  className?: string;
}) {
  return (
    <Container className={`badge badge--${variant} ${className}`.trim()}>
      {icon && <Icon name={icon} className="icon--size-17" />}
      {children}
    </Container>
  );
}
