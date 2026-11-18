import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
export default function IconBadge({
  icon,
  children,
  variant,
  as: Container = "span",
  className = "",
  tone = "lime",
  ...props
}: Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  tone?: "lime" | "violet" | "pink";
  as?: "span" | "div" | "b";
} & (
    | {
        variant:
          | "assignment"
          | "method"
          | "stage"
          | "stage-break"
          | "reveal"
          | "entity"
          | "console-challenge"
          | "console-challenge-lime"
          | "console-item";
        children: ReactNode;
        icon?: never;
      }
    | { variant?: undefined; icon: IconName; children?: never }
  )) {
  return (
    <Container
      {...props}
      className={`icon-badge icon-badge--${tone}${variant === "console-challenge-lime" ? " icon-badge--console-challenge" : ""}${variant ? ` icon-badge--${variant}` : ""} ${className}`.trim()}
    >
      {children ?? (icon && <Icon name={icon} className="icon--size-22" />)}
    </Container>
  );
}
