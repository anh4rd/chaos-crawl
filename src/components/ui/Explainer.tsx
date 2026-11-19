import type { HTMLAttributes } from "react";
export default function Explainer({
  tone,
  variant,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: "pink";
  variant?: "reward" | "contribution";
}) {
  return (
    <div
      {...props}
      className={`explainer${variant ? ` explainer--${variant}` : ""}${tone ? ` explainer--${tone}` : ""} ${className}`.trim()}
    />
  );
}
