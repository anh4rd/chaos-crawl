import type { ReactNode } from "react";
import Disclosure from "../../components/ui/Disclosure";
import Icon, { type IconName } from "../../components/ui/Icon";

interface Props {
  title: string;
  count: string;
  icon: IconName;
  open?: boolean;
  tourTarget?: string;
  children: ReactNode;
}

export default function HostReviewSection({
  title,
  count,
  icon,
  open,
  tourTarget,
  children,
}: Props) {
  return (
    <Disclosure
      variant="session"
      className="host-review-section"
      open={open}
      data-tour={tourTarget}
      summary={
        <span className="host-review-section__summary">
          <Icon name={icon} className="icon--size-20" aria-hidden="true" />
          <span className="host-review-section__title">{title}</span>
          <span className="host-review-section__count">{count}</span>
        </span>
      }
    >
      <div className="host-review-section__body">{children}</div>
    </Disclosure>
  );
}
