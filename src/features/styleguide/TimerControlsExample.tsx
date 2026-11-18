import { useState } from "react";
import Button from "../../components/ui/Button";
import ControlPanel from "../../components/ui/ControlPanel";
import ControlRow from "../../components/ui/ControlRow";
import IconButton from "../../components/ui/IconButton";
import Note from "../../components/ui/Note";
import TimerReadout from "../../components/ui/TimerReadout";
import RoundFlowControls from "../../components/session/RoundFlowControls";
import HostManagement from "../host-live/HostManagement";
import SessionPreview from "./SessionPreview";
import { Example } from "./Example";

export default function TimerControlsExample() {
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rewardActive, setRewardActive] = useState(false);
  const [notice, setNotice] = useState("No timer action selected.");
  return (
    <Example
      title="Session timer and flow controls"
      source="src/components/ui/TimerReadout.tsx + src/components/session/RoundFlowControls.tsx"
      code={
        '<ControlRow variant="timer">\n  <TimerReadout label="TIME REMAINING" value="00:30" />\n  <Button variant="control-primary" fullWidth={false}>Start timer</Button>\n</ControlRow>'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ControlPanel
            heading="LOCAL TIMER CONTROLS"
            marker="✦"
            aria-label="Local timer controls"
          >
            <Note variant="control">
              This timer uses local state and does not tick or publish.
            </Note>
            <ControlRow variant="timer">
              <TimerReadout label="TIME REMAINING" value="00:30" />
              <Button
                type="button"
                variant={running ? "control" : "control-primary"}
                fullWidth={false}
                disabled={busy}
                onClick={() => {
                  setRunning(!running);
                  setNotice(
                    running ? "Local timer paused." : "Local timer started.",
                  );
                }}
              >
                {running ? "Pause sample timer" : "Start sample timer"}
              </Button>
              <IconButton
                type="button"
                variant="control-replay"
                icon="rotate-ccw"
                iconClassName="icon--size-20"
                label="Reset sample timer"
                disabled={busy}
                onClick={() => {
                  setRunning(false);
                  setNotice("Local timer reset.");
                }}
              />
            </ControlRow>
            <RoundFlowControls
              heading="LOCAL BACKUP CONTROLS"
              label="Local backup controls"
              busy={busy}
              rewardActive={rewardActive}
              currentRound={2}
              totalRounds={3}
              timerReady
              onBreak={false}
              roundAwarded={false}
              canReward
              timerRunning={running}
              onPrevious={() => setNotice("Previous round selected locally.")}
              onReview={() => setNotice("Reward review selected locally.")}
              onNext={() => setNotice("Next round selected locally.")}
            />
            <ControlRow variant="break">
              <TimerReadout label="SAMPLE BREAK" value="01:00" />
              <Button
                type="button"
                variant="control-primary"
                fullWidth={false}
                disabled={busy}
                onClick={() => setNotice("Sample break ended locally.")}
              >
                End sample break
              </Button>
              <Button
                type="button"
                variant="timer-menu"
                fullWidth={false}
                aria-label="Edit sample break"
                disabled={busy}
                onClick={() => setNotice("Sample break menu selected locally.")}
              >
                ⋮
              </Button>
            </ControlRow>
          </ControlPanel>
        </HostManagement>
      </SessionPreview>
      <ControlRow>
        <label>
          <input
            type="checkbox"
            checked={busy}
            onChange={(event) => setBusy(event.target.checked)}
          />{" "}
          Sample controls busy
        </label>
        <label>
          <input
            type="checkbox"
            checked={rewardActive}
            onChange={(event) => setRewardActive(event.target.checked)}
          />{" "}
          Sample reward active
        </label>
      </ControlRow>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
