import type { HTMLAttributes } from "react";

export default function PageFrame({
  as: Element = "main",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: "main" | "div" }) {
  return (
    <Element {...props} className={`page-frame ${className}`.trim()}>
      {children}
    </Element>
  );
}
