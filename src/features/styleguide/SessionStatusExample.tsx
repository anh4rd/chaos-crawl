import { useState } from "react";
import Button from "../../components/ui/Button";
import ButtonLink from "../../components/ui/ButtonLink";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import Note from "../../components/ui/Note";
import PanelGrid from "../../components/ui/PanelGrid";
import SessionState from "../../components/session/SessionState";
import SyncStatus from "../../components/session/SyncStatus";
import { Example } from "./Example";
import SessionPreview from "./SessionPreview";

export default function SessionStatusExample() {
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    "Status references stay in this preview.",
  );
  return (
    <Example
      title="Shared participant status and recovery"
      source="src/components/session/SyncStatus.tsx + src/components/ui/LiveIndicator.tsx"
      code={
        "<SyncStatus>Live updates enabled <span>· synced 12:34:56</span></SyncStatus>"
      }
    >
      <label>
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => setCompleted(event.target.checked)}
        />{" "}
        Sample completed state
      </label>
      <label>
        <input
          type="checkbox"
          checked={synced}
          onChange={(event) => setSynced(event.target.checked)}
        />{" "}
        Sample sync time
      </label>
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Sample session spinner
      </label>
      <SessionPreview>
        <SessionState
          title={
            completed ? "Game over. Chaos achieved." : "Waiting for the host…"
          }
        >
          {completed ? (
            <ButtonLink
              to="/styleguide"
              variant="participant-leaderboard"
              fullWidth={false}
              onClick={(event) => {
                event.preventDefault();
                setNotice("Sample leaderboard action stays local.");
              }}
            >
              See the final leaderboard →
            </ButtonLink>
          ) : (
            <Note as="div" variant="participant-count">
              4 players in teams · 12 player limit
            </Note>
          )}
        </SessionState>
        <ContentPanel
          variant="private-feed"
          aria-label="Local private mission feed"
        >
          <PanelGrid variant="private-feed">
            <SessionState title="Sample private mission">
              <p>Only local sample content appears here.</p>
            </SessionState>
          </PanelGrid>
        </ContentPanel>
        <SyncStatus>
          Live updates enabled {synced && <span>· synced 12:34:56</span>}
        </SyncStatus>
        <Button
          type="button"
          variant="participant-rejoin"
          fullWidth={false}
          onClick={() => setNotice("Sample recovery action stays local.")}
        >
          {busy ? (
            <Icon
              name="loader-circle"
              className="icon--size-15 icon--spinning-session"
            />
          ) : (
            <Icon name="rotate-ccw" className="icon--size-15" />
          )}{" "}
          Need to rejoin on this device?
        </Button>
      </SessionPreview>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
