import type { ReactNode } from "react";
import Disclosure from "../../components/ui/Disclosure";
import Icon, { type IconName } from "../../components/ui/Icon";

export function PanelSummary({
  icon,
  title,
  status,
  live = false,
}: {
  icon: IconName;
  title: string;
  status: string;
  live?: boolean;
}) {
  return (
    <span className="control-console__summary">
      <span className="control-console__summary-icon">
        <Icon name={icon} className="icon--size-16" aria-hidden="true" />
      </span>
      <span className="control-console__summary-title">{title}</span>
      <span
        className={`control-console__summary-status${live ? " control-console__summary-status--live" : ""}`}
      >
        {status}
      </span>
      <Icon
        name="chevron-down"
        className="disclosure-chevron icon--size-20"
        aria-hidden="true"
      />
    </span>
  );
}

export default function HostAccordion({
  icon,
  title,
  status,
  accent,
  open,
  tourTarget,
  children,
}: {
  icon: IconName;
  title: string;
  status: string;
  accent?: "pink";
  open?: boolean;
  tourTarget?: string;
  children: ReactNode;
}) {
  return (
    <Disclosure
      variant="session"
      open={open}
      data-tour={tourTarget}
      className={`control-console__panel${accent ? ` control-console__panel--${accent}` : ""}`}
      summary={<PanelSummary icon={icon} title={title} status={status} />}
    >
      <div className="control-console__panel-content">{children}</div>
    </Disclosure>
  );
}
