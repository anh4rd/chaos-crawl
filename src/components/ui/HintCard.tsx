import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
export default function HintCard({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <div className="hint-card">
      <Icon name={icon} className="icon--size-17" />
      <span>{children}</span>
    </div>
  );
}
