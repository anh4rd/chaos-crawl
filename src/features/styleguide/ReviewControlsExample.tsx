import { useState } from "react";
import PresentationControls from "../../components/session/PresentationControls";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import FormGrid from "../../components/ui/FormGrid";
import FormLabel from "../../components/ui/FormLabel";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import StatTile from "../../components/ui/StatTile";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";

export default function ReviewControlsExample() {
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [choice, setChoice] = useState("one");
  const [notice, setNotice] = useState(
    "Review actions stay in this local example.",
  );
  return (
    <Example
      title="Shared review and presentation controls"
      source="src/components/ui/ContentPanel.tsx + FormGrid.tsx + src/components/session/PresentationControls.tsx"
      code={
        '<ContentPanel as="div" variant="review-controls">\n  <Overline as="strong" variant="review">HOST CONTROLS</Overline>\n  <FormGrid variant="review">…</FormGrid>\n</ContentPanel>'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ContentPanel variant="session">
            <PanelHeading variant="session">
              <h2>Final round</h2>
            </PanelHeading>
            <ContentPanel
              as="div"
              variant="review-controls"
              aria-label="Local final review controls"
            >
              <Overline as="strong" variant="review">
                LOCAL FINAL CONTROLS
              </Overline>
              <FormGrid variant="review">
                <FormLabel variant="review">
                  Choose sample challenge
                  <select
                    value={choice}
                    disabled={busy || voting}
                    onChange={(event) => setChoice(event.target.value)}
                  >
                    <option value="one">Team portrait</option>
                    <option value="two">Secret toast</option>
                  </select>
                </FormLabel>
                <StatTile
                  variant="review"
                  label="Players voted"
                  value="1 / 2"
                />
                <Button
                  type="button"
                  variant="review-comic-primary"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => setNotice("Sample results selected locally.")}
                >
                  Show sample results
                </Button>
                <Button
                  type="button"
                  variant="review-comic"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() =>
                    setNotice("Sample vote reopen selected locally.")
                  }
                >
                  Reopen sample vote
                </Button>
                <Button
                  type="button"
                  variant="review-comic"
                  fullWidth={false}
                  disabled
                >
                  Unavailable sample action
                </Button>
              </FormGrid>
            </ContentPanel>
          </ContentPanel>
          <ContentPanel
            as="div"
            variant="review-controls"
            aria-label="Local secret review controls"
          >
            <Overline variant="review">LOCAL SECRET CONTROLS</Overline>
            <StatTile
              variant="review"
              label="Votes cast"
              value={voting ? "1 / 2" : "0 / 2"}
            />
            <FormGrid variant="review">
              <Button
                type="button"
                variant="review-primary"
                className="btn--review-wide"
                fullWidth={false}
                disabled={busy}
                onClick={() => {
                  setVoting(!voting);
                  setNotice(
                    voting
                      ? "Sample voting closed locally."
                      : "Sample voting opened locally.",
                  );
                }}
              >
                {voting ? "Close sample voting" : "Open sample voting"}
              </Button>
              <Button
                type="button"
                variant="review"
                fullWidth={false}
                disabled={busy}
                onClick={() => {
                  setVoting(false);
                  setNotice("Sample review reset locally.");
                }}
              >
                Reset sample review
              </Button>
            </FormGrid>
          </ContentPanel>
          <PresentationControls aria-label="Local presentation controls">
            {connected && (
              <>
                <Button
                  type="button"
                  variant="review"
                  fullWidth={false}
                  disabled
                >
                  Previous sample slide
                </Button>
                <Button
                  type="button"
                  variant="review"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() =>
                    setNotice("Next sample slide selected locally.")
                  }
                >
                  Next sample slide
                </Button>
              </>
            )}
            <Button
              type="button"
              variant={connected ? "review-primary" : "review"}
              fullWidth={false}
              onClick={() => {
                setConnected(!connected);
                setNotice(
                  connected
                    ? "Sample display disconnected locally."
                    : "Sample display connected locally.",
                );
              }}
            >
              {connected
                ? "Disconnect sample display"
                : "Connect sample display"}
            </Button>
          </PresentationControls>
        </HostManagement>
      </SessionPreview>
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Sample review controls busy
      </label>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
