import { useState } from "react";
import RoundNumber from "../../components/session/RoundNumber";
import RoundSelector from "../../components/session/RoundSelector";
import SessionInvite from "../../components/session/SessionInvite";
import UpcomingChallenge from "../../components/session/UpcomingChallenge";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import CountBadge from "../../components/ui/CountBadge";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";

const rounds = [
  { id: "sample-one", round: 1, title: "Find something purple" },
  { id: "sample-two", round: 2, title: "Team portrait" },
];

export default function SessionPanelsExample() {
  const [round, setRound] = useState(1);
  const [busy, setBusy] = useState(false);
  const [teams, setTeams] = useState(false);
  const [notice, setNotice] = useState(
    "Choose a sample round or invite action.",
  );
  return (
    <Example
      title="Shared session panels and invitation"
      source="src/components/session/SessionInvite.tsx + RoundSelector.tsx + UpcomingChallenge.tsx"
      code={
        '<ContentPanel variant="session" stacked>\n  <PanelHeading variant="session">…</PanelHeading>\n  <RoundSelector rounds={rounds} currentRound={round} busy={busy} onSelect={setRound} />\n</ContentPanel>'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ContentPanel
            variant="session"
            stacked
            aria-label="Sample session panel"
          >
            <PanelHeading variant="session">
              <div>
                <Overline as="div" variant="session">
                  LOCAL SESSION
                </Overline>
                <h2>Round selection</h2>
                <p>Presentation data and actions stay inside this example.</p>
              </div>
              <CountBadge variant="session">2 rounds</CountBadge>
            </PanelHeading>
            <Badge as="div" variant="round">
              CURRENT ROUND
            </Badge>
            <RoundNumber round={round} total={2} />
            <RoundSelector
              rounds={rounds}
              currentRound={round}
              busy={busy}
              onSelect={(next) => {
                setRound(next);
                setNotice(`Sample round ${next} selected locally.`);
              }}
            />
            <UpcomingChallenge
              round={2}
              title="Team portrait"
              description="Capture the whole team in one frame."
              minutes={5}
              points={20}
              evidenceRequired
            >
              <Button
                type="button"
                variant="session-edit"
                fullWidth={false}
                disabled={busy}
                onClick={() =>
                  setNotice("Sample challenge edit selected locally.")
                }
              >
                Edit sample challenge
              </Button>
            </UpcomingChallenge>
            <Note variant="session">
              Shared surfaces receive data and callbacks only.
            </Note>
          </ContentPanel>
          <ContentPanel
            variant="session"
            stacked
            compact
            className="host-round-overview"
            aria-label="Sample round actions"
          >
            <Overline as="div" variant="session" tone="pink">
              LOCAL GAME CONTROL
            </Overline>
            <h2>Round actions</h2>
            <div className="host-round-overview__actions">
              <Button
                type="button"
                variant="round-secondary"
                fullWidth={false}
                disabled={busy}
                onClick={() =>
                  setNotice("Sample previous round selected locally.")
                }
              >
                Sample previous round
              </Button>
              <Button
                type="button"
                variant="round-primary"
                fullWidth={false}
                disabled={busy}
                onClick={() => setNotice("Sample next round selected locally.")}
              >
                Sample next round
              </Button>
            </div>
            <Button
              type="button"
              variant="round-finish"
              fullWidth={false}
              disabled={busy}
              onClick={() =>
                setNotice("Sample finish selected locally; no session changed.")
              }
            >
              Finish sample game
            </Button>
          </ContentPanel>
          <SessionInvite
            joinUrl="#/styleguide"
            onCopy={() =>
              setNotice(
                "Sample join code selected locally; clipboard unchanged.",
              )
            }
            playerCount={3}
            playerLimit={12}
            teamsEnabled={teams}
            hostChoosesTeams={false}
          />
        </HostManagement>
      </SessionPreview>
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Sample round controls busy
      </label>
      <label>
        <input
          type="checkbox"
          checked={teams}
          onChange={(event) => setTeams(event.target.checked)}
        />{" "}
        Sample invitation teams enabled
      </label>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
