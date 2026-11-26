var e=`import type { ReactNode } from "react";
import Icon, { type IconName } from "../ui/Icon";

export default function SessionState({
  title,
  children,
  icon = "gamepad2",
  action,
}: {
  title: string;
  children?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <section className="session-state">
      <Icon name={icon} className="icon--size-25" aria-hidden="true" />
      <h2>{title}</h2>
      {children}
      {action}
    </section>
  );
}
`;export{e as default};