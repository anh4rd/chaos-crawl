import { useState } from "react";
import PlayerAccessView from "../player-access/PlayerAccessView";
import RecoverySetup from "../player-access/RecoverySetup";
import type { JoinMode, JoinStep } from "../player-access/types";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
import { validJoinPhone } from "../player-access/phoneNumber";

export default function PlayerAccessExample() {
  const [mode, setMode] = useState<JoinMode>("join");
  const [joinStep, setJoinStep] = useState<JoinStep>(1);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [customCountryCode, setCustomCountryCode] = useState("");
  const [credential, setCredential] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showError, setShowError] = useState(false);
  const canSubmit =
    code.length === 6 &&
    (mode === "rejoin"
      ? credential.trim().length > 0
      : name.trim().length > 0 &&
        validJoinPhone(mobile, countryCode, customCountryCode)) &&
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
      <label>
        <input
          type="checkbox"
          checked={showError}
          onChange={(event) => setShowError(event.target.checked)}
        />{" "}
        Show sample join error
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
          countryCode={countryCode}
          customCountryCode={customCountryCode}
          credential={credential}
          busy={busy}
          error={
            showError ? "Sample join error. This reference remains local." : ""
          }
          notice={notice}
          canSubmit={canSubmit}
          onCodeChange={setCode}
          onNameChange={setName}
          onMobileChange={setMobile}
          onCountryCodeChange={setCountryCode}
          onCustomCountryCodeChange={setCustomCountryCode}
          onCredentialChange={setCredential}
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
      <details>
        <summary>Open local recovery setup</summary>
        <RecoverySetup
          as="section"
          credential="example-recovery-code"
          setupError=""
          onContinue={() =>
            setNotice("Sample recovery setup completed locally.")
          }
        />
      </details>
    </Example>
  );
}
