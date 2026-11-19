import type { FormEvent } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import DialogActions from "../../components/ui/DialogActions";
import DialogPanel from "../../components/ui/DialogPanel";
import FormGrid from "../../components/ui/FormGrid";
import FormLabel from "../../components/ui/FormLabel";
import SessionFeedback from "../../components/session/SessionFeedback";

export default function HostSideChallengeDialog({
  title,
  setTitle,
  description,
  setDescription,
  points,
  setPoints,
  duration,
  setDuration,
  busy,
  error,
  onDismissError,
  onClose,
  onSubmit,
}: {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  points: number;
  setPoints: (value: number) => void;
  duration: number;
  setDuration: (value: number) => void;
  busy: boolean;
  error: string;
  onDismissError: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <Dialog
      variant="host"
      label="Add side challenge"
      labelledBy="cc-host-side-challenge-title"
      dismissDisabled={busy}
      onClose={onClose}
    >
      <DialogPanel
        as="form"
        onSubmit={(event) => void onSubmit(event)}
        className="host-side-challenge-dialog"
      >
        <Badge variant="dialog">NEW SIDE CHALLENGE</Badge>
        <h2 id="cc-host-side-challenge-title">Add a side challenge</h2>
        <p>
          Players can upload evidence for this challenge while the game is live.
        </p>
        <FormLabel spaced>
          Challenge title
          <input
            required
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Find something purple"
          />
        </FormLabel>
        <FormLabel spaced>
          Side task description
          <textarea
            required
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What should players do?"
          />
        </FormLabel>
        <FormGrid variant="dialog">
          <FormLabel>
            Final vote bonus
            <input
              type="number"
              min={0}
              max={10000}
              value={points}
              onChange={(event) => setPoints(Number(event.target.value))}
            />
          </FormLabel>
          <FormLabel>
            Minutes
            <input
              type="number"
              min={1}
              max={240}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </FormLabel>
        </FormGrid>
        {error && (
          <SessionFeedback message={error} onDismiss={onDismissError} />
        )}
        <DialogActions>
          <Button
            type="button"
            variant="dialog"
            fullWidth={false}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="dialog-primary"
            fullWidth={false}
            disabled={busy || !title.trim() || !description.trim()}
          >
            {busy ? "Adding…" : "Add side challenge"}
          </Button>
        </DialogActions>
      </DialogPanel>
    </Dialog>
  );
}
