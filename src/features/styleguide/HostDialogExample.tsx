import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import DialogPanel from "../../components/ui/DialogPanel";
import DialogActions from "../../components/ui/DialogActions";
import DialogNotice from "../../components/ui/DialogNotice";
import FormGrid from "../../components/ui/FormGrid";
import FormLabel from "../../components/ui/FormLabel";
import Note from "../../components/ui/Note";
import { Example } from "./Example";

export default function HostDialogExample() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    note: "Local note",
    minutes: 5,
    points: 20,
  });
  const [savedNote, setSavedNote] = useState("");
  const [showError, setShowError] = useState(false);
  return (
    <Example
      title="Host modal behavior"
      source="src/components/ui/Dialog.tsx + DialogPanel.tsx + DialogActions.tsx"
      code={
        '<Dialog variant="host" label="Local host dialog" dismissDisabled={busy} onClose={close}>\n  <DialogPanel as="form" onSubmit={save}>\n    <Badge variant="dialog">LOCAL PREVIEW</Badge>\n    <h2>Local host dialog</h2>\n    <FormLabel spaced>Note<input /></FormLabel>\n    <DialogActions>…</DialogActions>\n  </DialogPanel>\n</Dialog>'
      }
    >
      <Button
        type="button"
        variant="comic-primary"
        fullWidth={false}
        onClick={() => setOpen(true)}
      >
        Open sample host dialog
      </Button>
      <Note>
        Keyboard focus stays inside. Busy state prevents dismissal without
        making requests.
      </Note>
      <Note as="output">
        {savedNote
          ? `Sample note saved: ${savedNote}`
          : "No sample note saved."}
      </Note>
      {open && (
        <Dialog
          variant="host"
          label="Local host dialog"
          labelledBy="example-host-dialog-title"
          dismissDisabled={busy}
          onClose={() => setOpen(false)}
        >
          <DialogPanel
            as="form"
            onSubmit={(event) => {
              event.preventDefault();
              setSavedNote(values.note);
              setOpen(false);
            }}
          >
            <Badge variant="dialog">LOCAL PREVIEW</Badge>
            <h2 id="example-host-dialog-title">Local host dialog</h2>
            <FormLabel spaced>
              Sample host note
              <input
                value={values.note}
                onChange={(event) =>
                  setValues({ ...values, note: event.target.value })
                }
              />
            </FormLabel>
            <FormGrid variant="dialog">
              <FormLabel>
                Sample minutes
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={values.minutes}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      minutes: Number(event.target.value),
                    })
                  }
                />
              </FormLabel>
              <FormLabel>
                Sample points
                <small>Preview only.</small>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={values.points}
                  onChange={(event) =>
                    setValues({ ...values, points: Number(event.target.value) })
                  }
                />
              </FormLabel>
            </FormGrid>
            <FormLabel spaced variant="checkbox">
              <input
                type="checkbox"
                checked={busy}
                onChange={(event) => setBusy(event.target.checked)}
              />{" "}
              Sample dialog busy
            </FormLabel>
            <DialogNotice kind="warning">
              This form saves only local preview state.
            </DialogNotice>
            <Button
              type="button"
              variant="dialog"
              fullWidth={false}
              disabled={busy}
              onClick={() => setShowError(true)}
            >
              Show sample dialog error
            </Button>
            {showError && (
              <DialogNotice kind="error" onDismiss={() => setShowError(false)}>
                Sample dialog error. Try dismissing this message.
              </DialogNotice>
            )}
            <DialogActions>
              <Button
                type="button"
                variant="dialog"
                fullWidth={false}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Close sample host dialog
              </Button>
              <Button
                type="submit"
                variant="dialog-primary"
                fullWidth={false}
                disabled={busy}
              >
                Save sample host note
              </Button>
            </DialogActions>
          </DialogPanel>
        </Dialog>
      )}
    </Example>
  );
}
