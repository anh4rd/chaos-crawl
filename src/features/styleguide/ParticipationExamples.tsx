import { useRef, useState } from "react";
import ChallengeActions, {
  type ChallengeParticipation,
} from "../game/ChallengeActions";
import LiveTask from "../game/LiveTask";
import SideChallenges from "../game/SideChallenges";
import { demoGame } from "./demoGame";
import { Example } from "./Example";

export function ParticipationExamples() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const participation: ChallengeParticipation = {
    fileInputRef,
    uploadingKey: null,
    completingKey: null,
    error: null,
    completionKey: (type, id) => `${type}:${id}`,
    hasCompleted: (type, id) => completed.includes(`${type}:${id}`),
    complete: async (type, id) => {
      setCompleted((current) => [...current, `${type}:${id}`]);
      setNotice("Demo challenge completed. No game data was changed.");
    },
    chooseUpload: () =>
      setNotice(
        "Photo / video upload selected. This demo does not upload files.",
      ),
    handleFileSelected: async () => {},
  };
  return (
    <>
      <Example
        title="ChallengeActions"
        source="src/features/game/ChallengeActions.tsx"
        code={
          '<ChallengeActions\n  challenge={{ id: 1, title: "Strike a pose", points: 20, type: "main" }}\n  allowMedia\n  participation={participation}\n/>\n// In a game, get participation from useChallengeParticipation.'
        }
      >
        <ChallengeActions
          challenge={{
            id: 2,
            title: "Strike a pose",
            points: 20,
            type: "main",
          }}
          allowMedia
          participation={participation}
        />
        <p role="status" className="sg-note">
          {notice || "Try the actions. Demo state stays on this page."}
        </p>
        <button
          type="button"
          className="sg-text-button"
          onClick={() => {
            setCompleted([]);
            setNotice("Demo reset.");
          }}
        >
          Reset demo
        </button>
      </Example>
      <div className="sg-grid">
        <Example
          title="LiveTask"
          source="src/features/game/LiveTask.tsx"
          code={
            "<LiveTask challenge={challenge} game={game} participation={participation} />\n// challenge: Challenge | undefined; game: GameState"
          }
        >
          <LiveTask
            challenge={{
              id: 1,
              pub_id: null,
              title: demoGame.current_challenge,
              description: demoGame.challenge_description,
              points: 20,
              reveal_order: 1,
              allow_photo_upload: true,
            }}
            game={demoGame}
            participation={participation}
          />
        </Example>
        <Example
          title="SideChallenges"
          source="src/features/game/SideChallenges.tsx"
          code={
            "<SideChallenges challenges={sideChallenges} participation={participation} />\n// challenges: SideChallenge[]; completed items are hidden."
          }
        >
          <SideChallenges
            challenges={[
              {
                id: 1,
                title: "Make a new friend",
                description: "Introduce your team to someone new.",
                points: 10,
                active: true,
              },
            ]}
            participation={participation}
          />
        </Example>
      </div>
    </>
  );
}
