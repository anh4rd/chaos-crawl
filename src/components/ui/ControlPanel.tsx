import type { HTMLAttributes, ReactNode } from "react";
import ContentPanel from "./ContentPanel";

export default function ControlPanel({
  heading,
  marker,
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  heading: string;
  marker: ReactNode;
}) {
  return (
    <ContentPanel
      {...props}
      variant="controls"
      className={`control-panel ${className}`.trim()}
    >
      <h2>
        <span className="control-panel__marker" aria-hidden="true">
          {marker}
        </span>
        {` ${heading}`}
      </h2>
      {children}
    </ContentPanel>
  );
}
