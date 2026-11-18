import type { ReactNode } from "react";
export default function TypeSample({
  variant,
  children,
}: {
  variant: "display" | "body";
  children: ReactNode;
}) {
  return <p className={`type-sample type-sample--${variant}`}>{children}</p>;
}
