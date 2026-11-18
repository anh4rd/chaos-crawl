import type { HTMLAttributes } from "react";

export default function FilterGroup({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`filter-group ${className}`.trim()} />;
}
