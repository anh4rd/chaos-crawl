import { useState } from "react";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import Dialog from "../../components/ui/Dialog";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";

export default function OverlayPanelExample() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Example
      title="Shared reward overlay frame"
      source="src/components/ui/ContentPanel.tsx + PanelHeading.tsx + Button.tsx"
      code={
        '<Dialog label="Sample reward overlay" dismissDisabled={busy} onClose={close}>\n  <ContentPanel variant="session" overlay stacked>\n    <PanelHeading variant="session" dismissible>…</PanelHeading>\n  </ContentPanel>\n</Dialog>'
      }
    >
      <HostManagement>
        <Button
          type="button"
          variant="comic-primary"
          fullWidth={false}
          onClick={() => setOpen(true)}
        >
          Open sample reward overlay
        </Button>
        {open && (
          <Dialog
            label="Sample reward overlay"
            dismissDisabled={busy}
            onClose={() => setOpen(false)}
          >
            <ContentPanel variant="session" overlay stacked>
              <PanelHeading variant="session" dismissible>
                <div>
                  <Overline as="div" variant="session">
                    LOCAL REWARD PREVIEW
                  </Overline>
                  <h2>Sample reward overlay</h2>
                </div>
                <Button
                  type="button"
                  variant="overlay-dismiss"
                  fullWidth={false}
                  aria-label="Close sample reward overlay"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  ×
                </Button>
              </PanelHeading>
              <Note variant="session">
                The frame supplies layout. Dialog owns focus and dismissal; this
                example makes no requests.
              </Note>
              <label>
                <input
                  type="checkbox"
                  checked={busy}
                  onChange={(event) => setBusy(event.target.checked)}
                />{" "}
                Sample reward busy
              </label>
              <Button
                type="button"
                variant="session-action"
                fullWidth={false}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Confirm sample reward
              </Button>
            </ContentPanel>
          </Dialog>
        )}
      </HostManagement>
    </Example>
  );
}
