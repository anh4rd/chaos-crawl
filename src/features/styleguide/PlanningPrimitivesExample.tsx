import { useState } from "react";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import CountBadge from "../../components/ui/CountBadge";
import FormGrid from "../../components/ui/FormGrid";
import Explainer from "../../components/ui/Explainer";
import ImageUpload from "../../components/ui/ImageUpload";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Note from "../../components/ui/Note";
import ControlRow from "../../components/ui/ControlRow";
import { Field } from "../../components/ui/Field";
import PlanNavigation from "../host-planning/PlanNavigation";
import HostPatternPreview from "./HostPatternPreview";
import ExampleGrid from "./ExampleGrid";
import { Example } from "./Example";
export default function PlanningPrimitivesExample() {
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(false);
  return (
    <>
      <Example
        title="Planning panels and fields"
        source="src/components/ui/ContentPanel.tsx + FormGrid.tsx"
        code={
          '<ContentPanel><PanelHeading><h3>Details</h3><CountBadge>2</CountBadge></PanelHeading><FormGrid>{fields}</FormGrid></ContentPanel>\n<Explainer tone="pink"><Icon name="info" /><p>Supporting context.</p></Explainer>'
        }
      >
        <HostPatternPreview>
          <ContentPanel>
            <PanelHeading>
              <div>
                <h3>Plan details</h3>
                <small>Local presentation state.</small>
              </div>
              <CountBadge>2</CountBadge>
            </PanelHeading>
            <FormGrid>
              <Field label="Example title">
                <input defaultValue="Friday crawl" />
              </Field>
              <Field label="Example time">
                <input type="time" defaultValue="18:00" />
              </Field>
            </FormGrid>
            <Explainer>
              <Icon name="info" className="icon--size-18" />
              <p>Panels accept ordinary content and callbacks.</p>
            </Explainer>
            <Explainer tone="pink">
              <Icon name="shield-check" className="icon--size-18" />
              <p>Use the pink tone for private-mission context.</p>
            </Explainer>
          </ContentPanel>
          <ExampleGrid>
            <ContentPanel variant="form">
              <h3>Form frame</h3>
              <p>Used for the game basics.</p>
            </ContentPanel>
            <ContentPanel variant="workspace">
              <h3>Workspace frame</h3>
              <p>Used for the builder.</p>
            </ContentPanel>
            <ContentPanel variant="library">
              <PanelHeading>
                <h3>Library panel</h3>
              </PanelHeading>
            </ContentPanel>
            <ContentPanel variant="selection">
              <PanelHeading>
                <h3>Selection panel</h3>
              </PanelHeading>
            </ContentPanel>
          </ExampleGrid>
        </HostPatternPreview>
      </Example>
      <Example
        title="Setup controls and image chooser"
        source="src/components/ui/Button.tsx + ImageUpload.tsx"
        code={
          '<Button variant="setup-primary" fullWidth={false}>Continue</Button>\n<ImageUpload label="Cover" description="Choose an image." alt="Cover preview" onFile={onFile} />'
        }
      >
        <HostPatternPreview>
          <ControlRow>
            <Button
              type="button"
              variant="setup-primary"
              fullWidth={false}
              onClick={() => setNotice("Continue selected locally.")}
            >
              Continue example
            </Button>
            <Button type="button" variant="setup-secondary" fullWidth={false}>
              Secondary example
            </Button>
            <Button
              type="button"
              variant="setup-primary"
              fullWidth={false}
              disabled
            >
              Saving example…
            </Button>
            <Button type="button" variant="setup-text" fullWidth={false}>
              Text example
            </Button>
            <Button
              type="button"
              variant="setup-filter"
              className={selected ? "btn--setup-filter-active" : ""}
              fullWidth={false}
              aria-pressed={selected}
              onClick={() => setSelected((value) => !value)}
            >
              Toggle example filter
            </Button>
            <Button
              type="button"
              variant="setup-favourite"
              fullWidth={false}
              aria-label="Favourite example"
            >
              <Icon name="heart" className="icon--size-16" />
            </Button>
            <Button
              type="button"
              variant="setup-select"
              className={selected ? "btn--setup-select-selected" : ""}
              fullWidth={false}
            >
              Select example
            </Button>
            <Button
              type="button"
              variant="setup-icon"
              fullWidth={false}
              aria-label="Delete setup example"
            >
              <Icon name="trash2" className="icon--size-15" />
            </Button>
            <Button
              type="button"
              variant="setup-move"
              fullWidth={false}
              aria-label="Move example up"
            >
              <Icon name="arrow-up" className="icon--size-14" />
            </Button>
          </ControlRow>
          <ImageUpload
            label="Example image"
            description="The chooser reports its filename locally."
            imageSrc={`${import.meta.env.BASE_URL}chaos-logo.png`}
            alt="Local cover preview"
            onFile={(file) => setNotice(`Selected ${file.name} locally.`)}
          />
          <Note as="output">
            {notice || "Choose a local file or try a control."}
          </Note>
        </HostPatternPreview>
      </Example>
      <Example
        title="PlanNavigation"
        source="src/features/host-planning/PlanNavigation.tsx"
        code={
          '<PlanNavigation stage="build" previousLabel="Players" nextLabel="Schedule" onBack={onBack} onNext={onNext} onSave={onSave}/>'
        }
      >
        <div className="planning-preview">
          <HostPatternPreview>
            <PlanNavigation
              stage="build"
              previousLabel="Players"
              nextLabel="Schedule"
              onBack={() =>
                setNotice("Previous planning section selected locally.")
              }
              onNext={() =>
                setNotice("Next planning section selected locally.")
              }
              onSave={() => setNotice("Draft action selected locally.")}
            />
          </HostPatternPreview>
        </div>
        <Note as="output">
          {notice || "Navigation callbacks remain local."}
        </Note>
      </Example>
    </>
  );
}
