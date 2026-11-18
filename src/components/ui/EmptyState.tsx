import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function EmptyState({
  icon,
  variant,
  children,
  action,
}: {
  children: ReactNode;
} & (
  | { variant: "workspace"; icon?: never; action?: never }
  | { variant?: "session"; icon: IconName; action?: ReactNode }
)) {
  if (variant === "workspace") {
    return <div className="empty-state empty-state--workspace">{children}</div>;
  }
  return (
    <div className={`empty-state${variant ? ` empty-state--${variant}` : ""}`}>
      <Icon
        name={icon}
        className={variant === "session" ? "icon--size-21" : "icon--size-28"}
      />
      <p>{children}</p>
      {action}
    </div>
  );
}
