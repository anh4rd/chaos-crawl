import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
export default function InputIcon({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <div className="input-icon">
      <Icon name={icon} className="icon--size-18" aria-hidden="true" />
      {children}
    </div>
  );
}
