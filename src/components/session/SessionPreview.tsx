import type { ReactNode } from "react";
export default function SessionPreview({ children }: { children: ReactNode }) {
  return <div className="session-preview">{children}</div>;
}
