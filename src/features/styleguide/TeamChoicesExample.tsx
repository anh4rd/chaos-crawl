import { useState } from "react";
import TeamNameForm from "../../components/session/TeamNameForm";
import ChoiceOption from "../../components/ui/ChoiceOption";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "./SessionPreview";
import CandidateList from "../../components/session/CandidateList";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import CountBadge from "../../components/ui/CountBadge";
import Overline from "../../components/ui/Overline";

export default function TeamChoicesExample() {
  const [selected, setSelected] = useState("alpha");
  const [name, setName] = useState("");
  const [lobbyName, setLobbyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Selected sample team: Alpha.");
  return (
    <>
      <Example
        title="Shared team choices and participant name form"
        source="src/components/ui/ChoiceOption.tsx + src/components/session/TeamNameForm.tsx"
        code={
          '<ChoiceOption label="Alpha" description="2/2 players" selected onClick={onSelect} />\n<TeamNameForm variant="participant" teamName={name} setTeamName={setName} placeholder="Or name a new team…" onSubmit={onSubmit}>…</TeamNameForm>'
        }
      >
        <SessionPreview>
          <label>
            <input
              type="checkbox"
              checked={busy}
              onChange={(event) => setBusy(event.target.checked)}
            />{" "}
            Sample team operation pending
          </label>
          <ContentPanel variant="choice">
            <PanelHeading variant="choice">
              <div>
                <Overline variant="choice">SQUAD UP</Overline>
                <h2>Choose a sample team</h2>
              </div>
              <CountBadge variant="choice">2 max</CountBadge>
            </PanelHeading>
            <CandidateList spaced>
              <ChoiceOption
                label="Alpha"
                description="2/2 players"
                selected={selected === "alpha"}
                disabled={busy}
                onClick={() => {
                  setSelected("alpha");
                  setNotice("Selected sample team: Alpha.");
                }}
              />
              <ChoiceOption
                label="Beta"
                description="1/2 players"
                selected={selected === "beta"}
                disabled={busy}
                onClick={() => {
                  setSelected("beta");
                  setNotice("Selected sample team: Beta.");
                }}
              />
              <ChoiceOption label="Gamma" description="Team full" disabled />
              <TeamNameForm
                variant="participant"
                teamName={name}
                setTeamName={setName}
                placeholder="Or name a new team…"
                onSubmit={(event) => {
                  event.preventDefault();
                  setNotice(`Created sample team: ${name.trim()}.`);
                  setName("");
                }}
              >
                <Button
                  variant="team-create"
                  fullWidth={false}
                  type="submit"
                  disabled={busy || !name.trim()}
                >
                  Create sample team
                </Button>
              </TeamNameForm>
            </CandidateList>
          </ContentPanel>
          <Note as="output">{notice}</Note>
        </SessionPreview>
      </Example>
      <Example
        title="Shared lobby team name form"
        source="src/components/session/TeamNameForm.tsx"
        code={
          '<TeamNameForm teamName={name} setTeamName={setName} placeholder="Team 4" onSubmit={onSubmit}>\n  <Button type="submit" variant="lobby-add">+ Add team</Button>\n</TeamNameForm>'
        }
      >
        <SessionPreview>
          <HostManagement>
            <TeamNameForm
              teamName={lobbyName}
              setTeamName={setLobbyName}
              placeholder="Team 4"
              onSubmit={(event) => {
                event.preventDefault();
                setNotice(`Added sample lobby team: ${lobbyName.trim()}.`);
                setLobbyName("");
              }}
            >
              <Button
                type="submit"
                variant="lobby-add"
                fullWidth={false}
                disabled={busy || !lobbyName.trim()}
              >
                + Add sample lobby team
              </Button>
            </TeamNameForm>
          </HostManagement>
          <Note as="output">{notice}</Note>
        </SessionPreview>
      </Example>
    </>
  );
}
