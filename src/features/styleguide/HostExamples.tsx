import ModerationExample from "./ModerationExample";
import IdeaCardExample from "./IdeaCardExample";
import CatalogueExample from "./CatalogueExample";
import SavedItemsExample from "./SavedItemsExample";
import FilterToolbarExample from "./FilterToolbarExample";
import StagePlanExample from "./StagePlanExample";
import OverlayPanelExample from "./OverlayPanelExample";
import RewardPrimitivesExample from "./RewardPrimitivesExample";
import ReviewBodyExample from "./ReviewBodyExample";
import ReviewControlsExample from "./ReviewControlsExample";
import MissionFormsExample from "./MissionFormsExample";
import AssignmentReviewExample from "./AssignmentReviewExample";
import SubmissionReviewExample from "./SubmissionReviewExample";
import HostDialogExample from "./HostDialogExample";
import SessionPanelsExample from "./SessionPanelsExample";
import TimerControlsExample from "./TimerControlsExample";
import HostChromeExample from "./HostChromeExample";
import LobbyPrimitivesExample from "./LobbyPrimitivesExample";
import PlanningPrimitivesExample from "./PlanningPrimitivesExample";
import WorkspaceExamples from "./WorkspaceExamples";
import Button from "../../components/ui/Button";
import ButtonLink from "../../components/ui/ButtonLink";
import IconButton from "../../components/ui/IconButton";
import HostShellPreview from "./HostShellPreview";
import { useState } from "react";
import ControlRow from "../../components/ui/ControlRow";
import Note from "../../components/ui/Note";
import BrandLink from "../../components/ui/BrandLink";
import InputIcon from "../../components/ui/InputIcon";
import { Field } from "../../components/ui/Field";
import SessionPreview from "./SessionPreview";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";
import { Section } from "./Section";
export default function HostExamples() {
  const [hostNotice, setHostNotice] = useState("");
  return (
    <Section
      id="host"
      number="05"
      title="Host patterns"
      description="Shared host shell, navigation, controls and page furniture."
    >
      <Example
        title="Shared comic controls"
        source="src/components/ui/Button.tsx + ButtonLink.tsx + IconButton.tsx"
        code={
          '<Button variant="comic-primary" fullWidth={false}>Create game</Button>\n<ButtonLink variant="comic-ghost" fullWidth={false} href="https://example.test">Open invite</ButtonLink>\n<IconButton icon="log-out" label="Sign out" />'
        }
      >
        <HostPatternPreview>
          <ControlRow>
            {(
              [
                ["primary", "Create game"],
                ["secondary", "Cancel"],
                ["lime", "Go live"],
              ] as const
            ).map(([variant, label]) => (
              <Button
                type="button"
                key={variant}
                variant={`comic-${variant}`}
                fullWidth={false}
                onClick={() => setHostNotice(`${label} selected in the demo.`)}
              >
                {label}
              </Button>
            ))}
            <Button variant="comic-primary" fullWidth={false} disabled>
              Working…
            </Button>
            <ButtonLink
              variant="comic-ghost"
              fullWidth={false}
              href="#/styleguide"
              onClick={(event) => {
                event.preventDefault();
                setHostNotice("Invite link selected locally.");
              }}
            >
              Open invite
            </ButtonLink>
            <IconButton
              icon="log-out"
              label="Sign out"
              onClick={() => setHostNotice("Sign out selected locally.")}
            />
            <IconButton
              icon="trash2"
              label="Delete example"
              variant="danger"
              onClick={() => setHostNotice("Delete selected locally.")}
            />
          </ControlRow>
        </HostPatternPreview>
        <Note as="output">{hostNotice || "Try each host action style."}</Note>
      </Example>
      <Example
        title="Host brand and input icon"
        source="src/components/ui/BrandLink.tsx + InputIcon.tsx"
        code={
          '<BrandLink variant="host" to="/host" />\n<Field variant="comic" label="Email address">\n  <InputIcon icon="mail"><input type="email" /></InputIcon>\n</Field>'
        }
      >
        <HostPatternPreview>
          <ControlRow>
            <SessionPreview>
              <BrandLink variant="host" to="/host/login" />
            </SessionPreview>
            <Field variant="comic" label="Email address">
              <InputIcon icon="mail">
                <input type="email" defaultValue="host@example.test" />
              </InputIcon>
            </Field>
          </ControlRow>
        </HostPatternPreview>
      </Example>
      <WorkspaceExamples />
      <SavedItemsExample />
      <FilterToolbarExample />
      <PlanningPrimitivesExample />
      <LobbyPrimitivesExample />
      <HostChromeExample />
      <TimerControlsExample />
      <SessionPanelsExample />
      <SubmissionReviewExample />
      <AssignmentReviewExample />
      <MissionFormsExample />
      <ReviewControlsExample />
      <ReviewBodyExample />
      <RewardPrimitivesExample />
      <OverlayPanelExample />
      <StagePlanExample />
      <HostDialogExample />
      <HostShellPreview />
      <CatalogueExample />
      <IdeaCardExample />
      <ModerationExample />
      <Note>
        HostWorkspace connects authentication to the presentation-only
        HostShell. The catalog documents the host panels and their data
        dependencies.
      </Note>
    </Section>
  );
}
