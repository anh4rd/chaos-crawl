var e=`import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function MetadataItem({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <span className="metadata-item">
      <Icon name={icon} className="icon--size-14" />
      {children}
    </span>
  );
}
`;export{e as default};