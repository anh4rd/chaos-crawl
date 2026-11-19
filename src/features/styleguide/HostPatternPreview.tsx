import type { ReactNode } from "react";
export default function HostPatternPreview({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="host-portal host-portal--app host-pattern-preview">
      {children}
    </div>
  );
}
