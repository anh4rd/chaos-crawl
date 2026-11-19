import type { ReactNode } from "react";
import SessionState from "./SessionState";
import ControlRow from "../ui/ControlRow";
import TimerReadout from "../ui/TimerReadout";

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
      <ControlRow variant="timer">
        <TimerReadout
          label={running ? "GAME RESUMES IN" : "BREAK TIMER"}
          value={running ? label : "PAUSED"}
        />
      </ControlRow>
      {children}
    </SessionState>
  );
}
