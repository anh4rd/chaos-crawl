import { useState } from "react";
import PlayerAccessView from "../player-access/PlayerAccessView";
import type { JoinMode, JoinStep } from "../player-access/types";
import Note from "../../components/ui/Note";
import { Example } from "./Example";

export default function PlayerAccessExample() {
  const [mode, setMode] = useState<JoinMode>("join");
  const [joinStep, setJoinStep] = useState<JoinStep>(1);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const canSubmit =
    code.length === 6 &&
    mobile.trim().length >= 8 &&
    (mode === "rejoin" || name.trim().length > 0) &&
    !busy;
  return (
    <Example
      title="Local join and rejoin"
      source="src/features/player-access/PlayerAccessView.tsx + src/components/ui/GameCodeInput.tsx"
      code={
        '<PlayerAccessView {...controlledValuesAndCallbacks} as="section" />'
      }
    >
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Simulate pending join
      </label>
      <Note as="output">
        {notice ||
          "This reference never stores credentials or contacts a backend."}
      </Note>
      <details>
        <summary>Open local join form</summary>
        <PlayerAccessView
          as="section"
          mode={mode}
          joinStep={joinStep}
          code={code}
          name={name}
          mobile={mobile}
          busy={busy}
          error=""
          notice={notice}
          canSubmit={canSubmit}
          onCodeChange={setCode}
          onNameChange={setName}
          onMobileChange={setMobile}
          onBack={() => setJoinStep(1)}
          onToggleMode={() => setMode(mode === "join" ? "rejoin" : "join")}
          onSubmit={(event) => {
            event.preventDefault();
            if (joinStep === 1) {
              if (code.length === 6) setJoinStep(2);
              return;
            }
            if (canSubmit) setNotice("Sample join submitted locally.");
          }}
        />
      </details>
    </Example>
  );
}
