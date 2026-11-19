import type { ReactNode } from "react";
import LiveIndicator from "../ui/LiveIndicator";

export default function SyncStatus({ children }: { children: ReactNode }) {
  return (
    <div className="sync-status">
      <LiveIndicator /> {children}
    </div>
  );
}
