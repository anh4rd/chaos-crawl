import type { ReactNode } from "react";

export default function TabList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="tab-list" role="tablist" aria-label={label}>
      {children}
    </div>
  );
}
