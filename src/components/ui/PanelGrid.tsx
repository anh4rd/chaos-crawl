import type { HTMLAttributes } from "react";

export default function PanelGrid({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`panel-grid ${className}`.trim()} />;
}
