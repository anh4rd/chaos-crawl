import type { HTMLAttributes } from "react";
export default function FormGrid({
  className = "",
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "dialog" | "review" | "contribution";
}) {
  return (
    <div
      {...props}
      className={`form-grid${variant ? ` form-grid--${variant}` : ""} ${className}`.trim()}
    />
  );
}
