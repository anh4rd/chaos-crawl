import TeamEditor from "../host-live/TeamEditor";
import { useState } from "react";
import Avatar from "../../components/ui/Avatar";
import ImageWell from "../../components/ui/ImageWell";
import StepProgress from "../../components/ui/StepProgress";
import StatTile from "../../components/ui/StatTile";
import ContentPanel from "../../components/ui/ContentPanel";
import { Field } from "../../components/ui/Field";
import Note from "../../components/ui/Note";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import ControlRow from "../../components/ui/ControlRow";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";
export default function LobbyPrimitivesExample() {
  const [teamName, setTeamName] = useState("Example team");
  const [savedTeamName, setSavedTeamName] = useState("Example team");
  const [photoNotice, setPhotoNotice] = useState("");
  const exampleTeam = {
    id: "local-team",
    name: savedTeamName,
    created_at: "2030-01-01T12:00:00Z",
  };
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(false);
  const imageSrc = `${import.meta.env.BASE_URL}chaos-logo.png`;
  return (
    <>
      <Example
        title="Lobby surfaces and identity"
        source="src/components/ui/Avatar.tsx + ImageWell.tsx + StatTile.tsx"
        code={
          '<Avatar name="Pat" imageSrc={photo} variant="roster" />\n<ImageWell variant="badge" imageSrc={cover}><span aria-hidden="true">🎉</span></ImageWell>\n<StatTile variant="compact" value={12} label="Players joined" />'
        }
      >
        <HostPatternPreview>
          <ContentPanel as="div" variant="lobby">
            <h2>Local lobby preview</h2>
            <ControlRow>
              <Avatar name="Pat" />
              <Avatar name="Pat" variant="roster" />
              <Avatar name="Pat" imageSrc={imageSrc} variant="compact" />
              <Avatar name="Pat" variant="member" />
              <ImageWell variant="badge">
                <span aria-hidden="true">🎉</span>
              </ImageWell>
              <ImageWell as="span" variant="team" imageSrc={imageSrc}>
                <Icon name="users" className="icon--size-21" />
              </ImageWell>
              <ImageWell as="span" variant="portrait">
                <Icon name="users" className="icon--size-27" />
              </ImageWell>
              <ImageWell variant="poster" imageSrc={imageSrc}>
                <span aria-hidden="true">🎉</span>
              </ImageWell>
            </ControlRow>
            <div className="metric-grid">
              <StatTile variant="compact" value={12} label="Players joined" />
              <StatTile variant="compact" value="2/3" label="Teams ready" />
            </div>
            <Field variant="lobby" label="Example team capacity">
              <select defaultValue="3">
                <option value="2">2 players</option>
                <option value="3">3 players</option>
              </select>
            </Field>
            <Note variant="lobby">All data stays inside this example.</Note>
          </ContentPanel>
        </HostPatternPreview>
      </Example>
      <Example
        title="Lobby controls and step progress"
        source="src/components/ui/Button.tsx + StepProgress.tsx"
        code={
          '<StepProgress value={step} total={6} />\n<Button variant="lobby-next" fullWidth={false} onClick={advance}>Continue</Button>'
        }
      >
        <HostPatternPreview>
          <p>Example step {step} of 6</p>
          <StepProgress value={step} total={6} />
          <ControlRow>
            <Button type="button" variant="lobby-action" fullWidth={false}>
              Copy example code
            </Button>
            <Button
              type="button"
              variant="lobby-save"
              fullWidth={false}
              disabled
            >
              Save example
            </Button>
            <Button
              type="button"
              variant="lobby-choice"
              fullWidth={false}
              className={selected ? "btn--lobby-choice-selected" : ""}
              aria-pressed={selected}
              onClick={() => setSelected((value) => !value)}
            >
              Toggle lobby choice
            </Button>
            <Button type="button" variant="lobby-player" fullWidth={false}>
              <Avatar name="Pat" variant="compact" />
              <strong>Pat</strong>
            </Button>
            <Button type="button" variant="lobby-member" fullWidth={false}>
              <Avatar name="Sam" variant="member" />
              <strong>Sam</strong>
            </Button>
            <Button type="button" variant="lobby-join" fullWidth={false}>
              Join example team
            </Button>
            <Button
              type="button"
              variant="lobby-join"
              className="btn--lobby-join-leave"
              fullWidth={false}
            >
              Leave example team
            </Button>
            <Button type="button" variant="lobby-add" fullWidth={false}>
              Add example team
            </Button>
            <Button type="button" variant="lobby-shortcut" fullWidth={false}>
              Ready example
            </Button>
            <Button
              type="button"
              variant="lobby-back"
              fullWidth={false}
              disabled={step === 1}
              onClick={() => setStep((value) => value - 1)}
            >
              Previous example step
            </Button>
            <Button
              type="button"
              variant="lobby-next"
              fullWidth={false}
              disabled={step === 6}
              onClick={() => setStep((value) => value + 1)}
            >
              Next example step
            </Button>
          </ControlRow>
          <Note as="output">Step {step} selected locally.</Note>
        </HostPatternPreview>
      </Example>
      <Example
        title="Keyboard photo chooser"
        source="src/features/host-live/TeamEditor.tsx"
        code={
          "<TeamEditor team={team} teams={[team]} members={[]} nameEdit={name} onNameChange={setName} busy={false} renameTeam={renameLocally} uploadTeamPhoto={reportFileLocally} assignTeam={assignLocally} />"
        }
      >
        <HostPatternPreview>
          <TeamEditor
            team={exampleTeam}
            teams={[exampleTeam]}
            members={[]}
            nameEdit={teamName}
            onNameChange={setTeamName}
            busy={false}
            renameTeam={async () => {
              setSavedTeamName(teamName);
            }}
            uploadTeamPhoto={async (_, file) => {
              setPhotoNotice(`Selected ${file.name} locally.`);
            }}
            assignTeam={async () => {
              setPhotoNotice("Team assignment stays local.");
            }}
          />
          <Note as="output">
            {photoNotice || "Tab to the photo chooser and press Space."}
          </Note>
        </HostPatternPreview>
      </Example>
    </>
  );
}
