import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function EmptyState({
  icon,
  variant,
  children,
  title,
  action,
}: {
  children: ReactNode;
} & (
  | {
      variant: "workspace";
      icon?: IconName;
      title?: string;
      action?: ReactNode;
    }
  | { variant?: "session"; icon: IconName; title?: never; action?: ReactNode }
)) {
  if (variant === "workspace") {
    return (
      <div className="empty-state empty-state--workspace">
        {icon && <Icon name={icon} className="icon--size-24" />}
        {title && <h3>{title}</h3>}
        {title ? <p>{children}</p> : children}
        {action}
      </div>
    );
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
