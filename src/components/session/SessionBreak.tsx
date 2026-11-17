import type { ReactNode } from "react";
import SessionState from "./SessionState";

export default function SessionBreak({
  label,
  running,
  children,
}: {
  label: string;
  running: boolean;
  children?: ReactNode;
}) {
  return (
    <SessionState title="Take a breather" icon="coffee">
      <p>
        {running ? "The game will resume in" : "The break timer is paused."}
      </p>
      <strong
        aria-label={running ? `Game resumes in ${label}` : "Break paused"}
      >
        {running ? label : "PAUSED"}
      </strong>
      {children}
    </SessionState>
  );
}
