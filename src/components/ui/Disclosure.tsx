import type { ComponentPropsWithoutRef, ReactNode } from "react";

export default function Disclosure({
  summary,
  children,
  variant,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"details"> & {
  summary: ReactNode;
  variant?: "session";
}) {
  return (
    <details
      {...props}
      className={`disclosure${variant ? ` disclosure--${variant}` : ""} ${className}`.trim()}
    >
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
