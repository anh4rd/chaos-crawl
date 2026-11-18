import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function EmptyState({
  icon,
  variant,
  children,
  action,
}: {
  icon: IconName;
  variant?: "session";
  children: ReactNode;
  action?: ReactNode;
}) {
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
