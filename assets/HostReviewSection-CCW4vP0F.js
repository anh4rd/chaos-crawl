var e=`import type { ReactNode } from "react";
import type { IconName } from "../../components/ui/Icon";
import HostAccordion from "./HostAccordion";

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
    <HostAccordion
      icon={icon}
      title={title}
      status={count}
      open={open}
      tourTarget={tourTarget}
    >
      <div className="host-review-section__body">{children}</div>
    </HostAccordion>
  );
}
`;export{e as default};