import { Children, type ReactNode } from "react";

export default function HostManagement({ children }: { children: ReactNode }) {
  if (Children.toArray(children).length === 0) return null;
  return (
    <div className="host-management host-portal">
      <div className="host-management__content">{children}</div>
    </div>
  );
}
