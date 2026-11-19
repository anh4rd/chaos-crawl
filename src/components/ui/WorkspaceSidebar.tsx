import type { ReactNode } from "react";
export default function WorkspaceSidebar({
  variant,
  children,
}: {
  variant?: "setup";
  children: ReactNode;
}) {
  return (
    <aside
      className={`workspace-sidebar${variant ? ` workspace-sidebar--${variant}` : ""}`}
    >
      {children}
    </aside>
  );
}
