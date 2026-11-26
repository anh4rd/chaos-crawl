var e=`import type { ReactNode } from "react";
import Icon from "./Icon";

export default function DemoNotice({
  children,
  actionLabel,
  onAction,
}: {
  children: ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="demo-notice">
      <Icon name="sparkles" className="icon--size-16" />
      {children}{" "}
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
`;export{e as default};