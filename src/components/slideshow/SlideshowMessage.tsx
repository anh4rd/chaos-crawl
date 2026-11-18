import type { ReactNode } from "react";

export default function SlideshowMessage({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="cc-final-tv-waiting">{children}</div>;
}
