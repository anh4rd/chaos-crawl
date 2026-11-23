import { useRef, useState } from "react";
import Button from "../../components/ui/Button";
import ControlPanel from "../../components/ui/ControlPanel";
import Note from "../../components/ui/Note";
import PanelGrid from "../../components/ui/PanelGrid";
import ContentPanel from "../../components/ui/ContentPanel";
import GuidedTour from "../../components/tour/GuidedTour";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";
import SessionTourPrompt from "../../components/session/SessionTourPrompt";

const steps = [
  {
    target: '[data-tour="example-host-tools"]',
    title: "Local host controls",
    body: "This shared panel uses local state. Try its action after closing the tour.",
  },
];

export default function HostChromeExample() {
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [notice, setNotice] = useState("No local action selected.");
  const actionRef = useRef<HTMLDivElement>(null);
  return (
    <Example
      title="Host frame and control panel"
      source="src/features/host-live/HostManagement.tsx + src/components/ui/ControlPanel.tsx"
      code={
        '<SessionTourPrompt label="Take sample tour" dismissLabel="Dismiss sample tour button" onStart={openTour} onDismiss={dismissTour} />'
      }
    >
      <SessionPreview>
        <HostManagement>
          {!tourDismissed && (
            <SessionTourPrompt
              label="✦ Take sample tour"
              dismissLabel="Dismiss sample tour button"
              onStart={() => setTourOpen(true)}
              onDismiss={() => {
                actionRef.current?.querySelector("button")?.focus();
                setTourDismissed(true);
              }}
            />
          )}
          <PanelGrid>
            <ControlPanel
              heading="LOCAL HOST CONTROLS"
              marker="✦"
              aria-label="Local host controls"
              data-tour="example-host-tools"
            >
              <div ref={actionRef}>
                <Button
                  type="button"
                  variant="lobby-action"
                  fullWidth={false}
                  onClick={() => setNotice("Local host action selected.")}
                >
                  Try local host action
                </Button>
              </div>
              <Note as="output">{notice}</Note>
            </ControlPanel>
            <ContentPanel variant="session">
              <Note>
                Local context stays beside the controls on wide screens and
                below them on narrow screens.
              </Note>
            </ContentPanel>
          </PanelGrid>
        </HostManagement>
      </SessionPreview>
      {tourOpen && (
        <GuidedTour
          label="HOST FRAME EXAMPLE"
          steps={steps}
          onClose={() => setTourOpen(false)}
        />
      )}
    </Example>
  );
}
