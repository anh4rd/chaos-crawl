import IconBadge from "../ui/IconBadge";
import type { ReactNode } from "react";

export default function AssignmentRow({
  icon,
  title,
  recipient,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  recipient: ReactNode;
  status: string;
  children?: ReactNode;
}) {
  return (
    <article className="assignment-row">
      <IconBadge as="div" variant="assignment" aria-hidden="true">
        {icon}
      </IconBadge>
      <div className="assignment-row__copy">
        <strong>{title}</strong>
        <span>{recipient}</span>
        <small>{status}</small>
      </div>
      {children}
    </article>
  );
}
