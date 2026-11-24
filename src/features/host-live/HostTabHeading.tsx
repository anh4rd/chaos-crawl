import type { ReactNode } from "react";

export default function HostTabHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="host-tab-heading">
      <div className="host-tab-heading__copy">
        <h2 className="host-tab-heading__title">{title}</h2>
        {subtitle && <p className="host-tab-heading__subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
