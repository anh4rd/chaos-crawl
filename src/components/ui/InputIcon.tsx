import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
export default function InputIcon({
  icon,
  children,
  variant,
  iconClassName = "icon--size-18",
}: {
  icon: IconName;
  variant?: "access";
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`input-icon${variant ? ` input-icon--${variant}` : ""}`}>
      <Icon name={icon} className={iconClassName} aria-hidden="true" />
      {children}
    </div>
  );
}
