import { useState } from "react";
import HostControlOverrides from "../host-live/HostControlOverrides";
import HostManagement from "../host-live/HostManagement";
import SessionPreview from "../../components/session/SessionPreview";
import { Example } from "./Example";

const rounds = [
  {
    id: "one",
    title: "Make an entrance",
    description: "Show your best entrance.",
    round_number: 1,
  },
  {
    id: "two",
    title: "Team portrait",
    description: "Capture your team together.",
    round_number: 2,
  },
];

export default function HostControlOverridesExample() {
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [notice, setNotice] = useState("Try the local override controls.");
  const [reviewRequest, setReviewRequest] = useState(0);
  const time = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return (
    <Example
      title="Host control overrides"
      source="src/features/host-live/HostControlOverrides.tsx"
      code="<HostControlOverrides {...props} />"
    >
      <SessionPreview>
        <HostManagement>
          <HostControlOverrides
            rounds={rounds}
            currentRound={round}
            status="live"
            busy={false}
            rewardActive={false}
            timerReady
            onBreak={onBreak}
            currentRoundPointsAwarded={false}
            resumeRound={2}
            onNextRound={() => setNotice("Sample next round selected.")}
            finalReviewTitle="Review side challenges and secret missions"
            reviewRequest={reviewRequest}
            onReviewOpened={() => setReviewRequest(0)}
            onFinalReview={() => {
              setRunning(false);
              setReviewRequest((request) => request + 1);
              setNotice("Sample final review selected.");
            }}
            sideChallengeControls={<p>Local side challenge controls.</p>}
            secretMissionControls={<p>Local secret mission controls.</p>}
            timerRunning={running}
            timerSeconds={seconds}
            timerText={time}
            onMoveRound={(value) => {
              setRound(value);
              setSeconds(300);
              setRunning(false);
              setNotice(`Sample round ${value} selected.`);
            }}
            onToggleTimer={() => setRunning(!running)}
            onResetTimer={() => {
              setSeconds(300);
              setRunning(false);
            }}
            onRestartTimer={() => {
              setSeconds(300);
              setRunning(true);
            }}
            onSetTimer={setSeconds}
            onAddMinutes={(value) => setSeconds(seconds + value * 60)}
            onEditBreak={() => setNotice("Sample break timer selected.")}
            onStartBreak={() => {
              setOnBreak(true);
              setNotice("Sample break started.");
            }}
            onEditChallenge={() => setNotice("Sample challenge edit selected.")}
            onReviewPoints={() =>
              setNotice("Sample challenge review selected.")
            }
            onReviewSubmissions={() =>
              setNotice("Sample submissions selected.")
            }
            onSecretReview={() => setNotice("Sample missions selected.")}
            onSchedule={() => setNotice("Sample schedule selected.")}
            onFinish={() => setNotice("Sample finish selected.")}
            onMemories={() => setNotice("Sample memories selected.")}
          />
          <output>{notice}</output>
        </HostManagement>
      </SessionPreview>
    </Example>
  );
}
