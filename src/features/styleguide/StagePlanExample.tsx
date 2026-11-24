import { useState } from "react";
import RoundPlan from "../../components/session/RoundPlan";
import StagePreview from "../../components/session/StagePreview";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import HostManagement from "../host-live/HostManagement";
import HostBreakPanel from "../host-live/HostBreakPanel";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";

export default function StagePlanExample() {
  const [round, setRound] = useState(1);
  const [readOnly, setReadOnly] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [notice, setNotice] = useState(
    "Choose a sample round or stage action.",
  );
  return (
    <Example
      title="Shared stage preview and round plan"
      source="src/components/session/StagePreview.tsx + RoundPlan.tsx + RoundSelector.tsx"
      code={
        '<StagePreview label="UP NEXT" illustration="✨" title="Team portrait" description="Capture your team." highlighted={false} />\n<RoundPlan rounds={rounds} currentRound={round} interactive={!readOnly} busy={false} onSelect={setRound} />'
      }
    >
      <SessionPreview>
        <HostManagement>
          <StagePreview
            label={onBreak ? "BREAK IN PROGRESS" : "UP NEXT · ROUND 2"}
            illustration={onBreak ? "☕" : "✨"}
            title={onBreak ? "Round 2 follows the break" : "Team portrait"}
            description={
              onBreak
                ? "The next challenge follows this local break."
                : "Capture your team together."
            }
            highlighted={onBreak}
          >
            {!onBreak && (
              <Button
                type="button"
                variant="session-edit"
                fullWidth={false}
                onClick={() => setNotice("Sample stage edit selected locally.")}
              >
                Edit sample stage
              </Button>
            )}
          </StagePreview>
          {onBreak && (
            <HostBreakPanel
              busy={readOnly}
              nextRound={2}
              roundCount={2}
              preparation={{
                equipment: ["Camera", "Props"],
                setup: "Choose a photo spot.",
                prep: "Gather everyone together.",
              }}
              nextChallenge={{
                title: "Team portrait",
                description: "Capture your team together.",
                points: 40,
                duration_minutes: 5,
              }}
              onEditChallenge={() =>
                setNotice("Sample challenge edit selected locally.")
              }
            />
          )}
          <RoundPlan
            rounds={[
              {
                id: "one",
                round: 1,
                title: "Make an entrance",
                description: "Show your best entrance.",
                points: 20,
              },
              {
                id: "two",
                round: 2,
                title: "Team portrait",
                description: "Capture your team together.",
                points: 40,
              },
            ]}
            currentRound={round}
            interactive={!readOnly}
            busy={false}
            onSelect={(value) => {
              setRound(value);
              setNotice(`Sample plan round ${value} selected locally.`);
            }}
          />
        </HostManagement>
      </SessionPreview>
      <label>
        <input
          type="checkbox"
          checked={readOnly}
          onChange={(event) => setReadOnly(event.target.checked)}
        />{" "}
        Sample round plan read-only
      </label>
      <label>
        <input
          type="checkbox"
          checked={onBreak}
          onChange={(event) => setOnBreak(event.target.checked)}
        />{" "}
        Sample stage break active
      </label>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
