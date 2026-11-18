import type { HTMLAttributes } from "react";
export default function PanelHeading({
  className = "",
  variant,
  dismissible = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?:
    | "session"
    | "choice"
    | "reveal"
    | "moderation"
    | "contribution"
    | "overview"
    | "console"
    | "console-section"
    | "console-card";
  dismissible?: boolean;
}) {
  return (
    <div
      {...props}
      className={`panel-heading${dismissible ? " panel-heading--dismissible" : ""}${variant ? ` panel-heading--${variant}` : ""} ${className}`.trim()}
    />
  );
}
