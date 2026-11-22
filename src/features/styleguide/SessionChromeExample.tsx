import { useState } from "react";
import { SessionGameTitlebar } from "../../components/session/SessionGameTitlebar";
import { SessionPlayerProfile } from "../../components/session/SessionPlayerProfile";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";
import { useClipboard } from "../../components/ui/useClipboard";
export default function SessionChromeExample({ name }: { name: string }) {
  const [copyNotice, setCopyNotice] = useState("");
  const [showScore, setShowScore] = useState(true);
  const { copied, copy } = useClipboard({ text: "123456", resetAfterMs: 1800 });
  async function copyGameCode() {
    const result = await copy();
    if (result === "copied") setCopyNotice("");
    if (result === "failed")
      setCopyNotice("Copy the demo code manually: 123456.");
  }
  return (
    <Example
      title="SessionPlayerProfile + SessionGameTitlebar"
      source="src/components/session/SessionPlayerProfile.tsx"
      code={
        'import { SessionPlayerProfile } from "./components/session/SessionPlayerProfile";\nimport { SessionGameTitlebar } from "./components/session/SessionGameTitlebar";\n\n<SessionPlayerProfile viewerRole="player" name="Alex"\n  subtitle="Team Chaos" score={120} rank={2} showScore={showScore} />\n<SessionGameTitlebar tourTarget="example-game-details" name="Friday Night Chaos" code="123456"\n  photoUrl={photoUrl} copied={copied} onCopy={copyCode} />'
      }
    >
      <SessionPreview>
        <SessionPlayerProfile
          viewerRole="player"
          name="Alex"
          subtitle={name || "Team Chaos"}
          score={120}
          rank={2}
          showScore={showScore}
        />
        <SessionGameTitlebar
          tourTarget="example-game-details"
          name="Friday Night Chaos"
          code="123456"
          photoUrl={`${import.meta.env.BASE_URL}chaos-logo.png`}
          copied={copied}
          onCopy={() => void copyGameCode()}
        />
      </SessionPreview>
      <label>
        <input
          type="checkbox"
          checked={showScore}
          onChange={(event) => setShowScore(event.target.checked)}
        />{" "}
        Show profile score and rank
      </label>
      <Note role="status">
        {copyNotice || "Edit the team name above to update this profile."}
      </Note>
    </Example>
  );
}
