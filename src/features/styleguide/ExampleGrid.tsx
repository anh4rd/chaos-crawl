import type { ReactNode } from "react";
export default function ExampleGrid({
  spaced = false,
  children,
}: {
  spaced?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`example-grid${spaced ? " example-grid--spaced" : ""}`}>
      {children}
    </div>
  );
}
