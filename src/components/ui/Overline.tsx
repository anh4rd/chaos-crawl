import type { ComponentPropsWithoutRef } from "react";
export default function Overline({
  tone,
  variant,
  withIcon = false,
  as: Container = "span",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  tone?: "primary" | "pink";
  variant?:
    | "slideshow"
    | "slideshow-waiting"
    | "session"
    | "review"
    | "choice"
    | "reveal"
    | "workspace"
    | "banner"
    | "moderation"
    | "inverse"
    | "console"
    | "console-eyebrow"
    | "plain"
    | "plain-strong"
    | "plain-accent";
  withIcon?: boolean;
  as?: "span" | "div" | "strong" | "p";
}) {
  return (
    <Container
      {...props}
      className={`overline${variant ? ` overline--${variant}` : ""}${withIcon ? " overline--icon" : ""}${tone ? ` overline--${tone}` : ""} ${className}`.trim()}
    />
  );
}
