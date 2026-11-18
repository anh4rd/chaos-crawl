import { useState } from "react";
import { SessionGameTitlebar } from "../../components/session/SessionGameTitlebar";
import { SessionPlayerProfile } from "../../components/session/SessionPlayerProfile";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
import SessionPreview from "./SessionPreview";
export default function SessionChromeExample({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  async function copyGameCode() {
    try {
      await navigator.clipboard.writeText("123456");
      setCopied(true);
      setCopyNotice("Demo game code copied.");
    } catch {
      setCopied(false);
      setCopyNotice("Copy the demo code manually: 123456.");
    }
  }
  return (
    <Example
      title="SessionPlayerProfile + SessionGameTitlebar"
      source="src/components/session/SessionPlayerProfile.tsx"
      code={
        'import { SessionPlayerProfile } from "./components/session/SessionPlayerProfile";\nimport { SessionGameTitlebar } from "./components/session/SessionGameTitlebar";\n\n<SessionPlayerProfile viewerRole="player" name="Alex"\n  subtitle="Team Chaos" score={120} rank={2} />\n<SessionGameTitlebar tourTarget="example-game-details" name="Friday Night Chaos" code="123456"\n  copied={copied} onCopy={copyCode} />'
      }
    >
      <SessionPreview>
        <SessionPlayerProfile
          viewerRole="player"
          name="Alex"
          subtitle={name || "Team Chaos"}
          score={120}
          rank={2}
        />
        <SessionGameTitlebar
          tourTarget="example-game-details"
          name="Friday Night Chaos"
          code="123456"
          copied={copied}
          onCopy={() => void copyGameCode()}
        />
      </SessionPreview>
      <Note role="status">
        {copyNotice || "Edit the team name above to update this profile."}
      </Note>
    </Example>
  );
}
