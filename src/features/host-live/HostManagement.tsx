import { Children, type ReactNode } from "react";

export default function HostManagement({ children }: { children: ReactNode }) {
  if (Children.toArray(children).length === 0) return null;
  return (
    <div className="host-management host-portal cc-host-live-standalone">
      <div className="cc-session-page cc-host-game-redesign cc-host-live-integrated">
        {children}
      </div>
    </div>
  );
}
