import type { HTMLAttributes } from "react";

export default function FilterGroup({
  variant,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "categories" | "console" | "console-action";
}) {
  return (
    <div
      {...props}
      className={`filter-group${variant === "console-action" ? " filter-group--console" : ""}${variant ? ` filter-group--${variant}` : ""} ${className}`.trim()}
    />
  );
}
