var e=`import type { ReactNode } from "react";
import Button from "../ui/Button";
import ControlRow from "../ui/ControlRow";

export default function PlaybackControls({
  paused,
  previous,
  togglePaused,
  next,
  endAction,
}: {
  paused: boolean;
  previous: () => void;
  togglePaused: () => void;
  next: () => void;
  endAction: ReactNode;
}) {
  return (
    <ControlRow variant="playback">
      <Button type="button" onClick={previous}>
        ← Previous
      </Button>
      <Button type="button" onClick={togglePaused}>
        {paused ? "▶ Resume" : "⏸ Pause"}
      </Button>
      <Button type="button" onClick={next}>
        Next →
      </Button>
      {endAction}
    </ControlRow>
  );
}
`;export{e as default};