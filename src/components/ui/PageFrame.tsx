import type { HTMLAttributes } from "react";

export default function PageFrame({
  as: Element = "main",
  variant = "stack",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "main" | "div";
  variant?: "stack" | "compact" | "loading" | "bare";
}) {
  const modifier = variant === "bare" ? "" : ` page-frame--${variant}`;
  return (
    <Element {...props} className={`page-frame${modifier} ${className}`.trim()}>
      {children}
    </Element>
  );
}
