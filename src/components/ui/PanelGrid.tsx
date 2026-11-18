import type { HTMLAttributes } from "react";

export default function PanelGrid({
  className = "",
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "collection" | "ideas" | "stack" | "stats";
}) {
  return (
    <div
      {...props}
      className={`panel-grid${variant ? ` panel-grid--${variant}` : ""} ${className}`.trim()}
    />
  );
}
