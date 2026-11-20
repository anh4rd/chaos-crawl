import { useState } from "react";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
export default function ChallengeExample() {
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  return (
    <Example
      title="SessionMainChallengeCard"
      source="src/components/session/SessionMainChallengeCard.tsx"
      code={
        '<SessionMainChallengeCard viewerRole="player"\n  title="Strike a pose" description="Get your whole team into one photo."\n  points={20} round={1} roundCount={4} durationMinutes={5}\n  timerLabel="04:32" timerCaption="TIME LEFT"\n  action={<Button type="button" onClick={onComplete}>Mark done</Button>}\n/>'
      }
    >
      <SessionMainChallengeCard
        viewerRole="player"
        title="Strike a pose"
        description="Get your whole team into one legendary photo."
        points={20}
        round={1}
        roundCount={4}
        durationMinutes={5}
        timerLabel="04:32"
        timerCaption="TIME LEFT"
        action={
          <Button
            type="button"
            fullWidth={false}
            onClick={() => setChallengeCompleted((value) => !value)}
          >
            {challengeCompleted ? "✓ Completed" : "Mark done"}
          </Button>
        }
      />
      <Note>
        Static timer label · use ScheduledCountdown when a live countdown is
        needed. OpenMoji matches the challenge copy; hosts can select a
        different emoji or supply custom artwork in the schedule.
      </Note>
    </Example>
  );
}
