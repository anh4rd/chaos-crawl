import type { HTMLAttributes } from "react";

export default function FilterGroup({
  variant,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: "categories" }) {
  return (
    <div
      {...props}
      className={`filter-group${variant ? ` filter-group--${variant}` : ""} ${className}`.trim()}
    />
  );
}
