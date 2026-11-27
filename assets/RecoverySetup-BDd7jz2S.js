var e=`import { useState } from "react";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import FormLabel from "../../components/ui/FormLabel";
import Note from "../../components/ui/Note";
import { useClipboard } from "../../components/ui/useClipboard";

export default function RecoverySetup({
  as: Container = "main",
  credential,
  onContinue,
  setupError,
}: {
  as?: "main" | "section";
  credential: string;
  onContinue: () => void;
  setupError: string;
}) {
  const { copied, copy } = useClipboard({ text: credential });
  const [error, setError] = useState("");

  async function copyCredential() {
    const outcome = await copy();
    if (outcome === "failed")
      setError("Copy is unavailable. Select the code and copy it manually.");
    else if (outcome === "copied") setError("");
  }

  function saveCredential() {
    const url = URL.createObjectURL(
      new Blob([credential], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "chaos-crawl-recovery-code.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Container className="player-access">
      <ContentPanel variant="access-field">
        <h1>Save your recovery code</h1>
        <Note>
          Keep this code private. If you lose it and your browser storage,
          recovery may be impossible without independent verification.
        </Note>
        <FormLabel htmlFor="recovery-code">Your recovery code</FormLabel>
        <input
          id="recovery-code"
          value={credential}
          readOnly
          autoComplete="off"
        />
        {(error || setupError) && <p role="alert">{error || setupError}</p>}
        {copied && <output>Code copied.</output>}
        <Button
          type="button"
          variant="comic-secondary"
          onClick={() => void copyCredential()}
        >
          Copy code
        </Button>
        <Button
          type="button"
          variant="comic-secondary"
          onClick={saveCredential}
        >
          Save code
        </Button>
        <Button type="button" variant="comic-primary" onClick={onContinue}>
          Continue without saving
        </Button>
      </ContentPanel>
    </Container>
  );
}
`;export{e as default};